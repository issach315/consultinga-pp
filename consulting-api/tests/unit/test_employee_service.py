import pytest

from app.core.exceptions import AppError, ConflictError
from app.modules.employees.constants import EmployeeStatus
from app.modules.employees.schemas import (
    EmployeeCreateRequest,
    EmployeePermissionIn,
    EmployeeUpdateRequest,
)
from app.modules.employees.service import EmployeeService


def _payload(**overrides) -> EmployeeCreateRequest:
    defaults = {
        "first_name": "Jane",
        "last_name": "Doe",
        "work_email": "jane.doe@example.com",
        "role": "RECRUITER",
        "permissions": [EmployeePermissionIn(module="recruitment", actions=["CREATE", "READ"])],
    }
    defaults.update(overrides)
    return EmployeeCreateRequest(**defaults)


def test_onboard_employee_generates_sequential_code(db_session, make_tenant) -> None:
    tenant, _ = make_tenant(employee_id_prefix="DOM", enabled_modules=["recruitment"])
    service = EmployeeService(db_session)

    employee, raw_token = service.onboard_employee(tenant.id, _payload())

    assert employee.employee_code == "DOM-EMP-00001"
    assert employee.status == EmployeeStatus.INVITED
    assert raw_token  # non-empty raw invite token returned for the router to email


def test_onboard_employee_never_reuses_sequence_numbers(db_session, make_tenant) -> None:
    tenant, _ = make_tenant(employee_id_prefix="DOM", enabled_modules=["recruitment"])
    service = EmployeeService(db_session)

    first, _ = service.onboard_employee(tenant.id, _payload(work_email="a@example.com"))
    second, _ = service.onboard_employee(tenant.id, _payload(work_email="b@example.com"))

    assert first.employee_code == "DOM-EMP-00001"
    assert second.employee_code == "DOM-EMP-00002"


def test_onboard_employee_rejects_role_not_valid_for_tenant_type(db_session, make_tenant) -> None:
    tenant, _ = make_tenant(tenant_type="US IT", enabled_modules=["recruitment"])
    service = EmployeeService(db_session)

    with pytest.raises(AppError):
        service.onboard_employee(tenant.id, _payload())


def test_onboard_employee_rejects_duplicate_email(db_session, make_tenant) -> None:
    tenant, _ = make_tenant(enabled_modules=["recruitment"])
    service = EmployeeService(db_session)
    service.onboard_employee(tenant.id, _payload(work_email="dupe@example.com"))

    with pytest.raises(ConflictError):
        service.onboard_employee(tenant.id, _payload(work_email="dupe@example.com"))


def test_onboard_employee_rejects_module_not_enabled_for_tenant(db_session, make_tenant) -> None:
    tenant, _ = make_tenant(enabled_modules=["clients"])  # "recruitment" not enabled
    service = EmployeeService(db_session)

    with pytest.raises(AppError):
        service.onboard_employee(tenant.id, _payload())


def test_permission_dependency_rule_enforced_server_side(db_session, make_tenant) -> None:
    tenant, _ = make_tenant(enabled_modules=["recruitment"])
    service = EmployeeService(db_session)

    # Client sends CREATE without READ — server must add READ anyway.
    employee, _ = service.onboard_employee(
        tenant.id,
        _payload(permissions=[EmployeePermissionIn(module="recruitment", actions=["CREATE"])]),
    )

    entry = next(p for p in employee.permissions if p.module == "recruitment")
    assert set(entry.actions) == {"CREATE", "READ"}


def test_update_permissions_reapplies_dependency_rule(db_session, make_tenant) -> None:
    tenant, _ = make_tenant(enabled_modules=["recruitment"])
    service = EmployeeService(db_session)
    employee, _ = service.onboard_employee(tenant.id, _payload())

    updated = service.update_permissions(
        tenant.id,
        employee.id,
        [EmployeePermissionIn(module="recruitment", actions=["DELETE"])],
    )

    entry = next(p for p in updated.permissions if p.module == "recruitment")
    assert set(entry.actions) == {"DELETE", "READ"}


def test_set_status_toggles_active_inactive(db_session, make_tenant) -> None:
    tenant, _ = make_tenant(enabled_modules=["recruitment"])
    service = EmployeeService(db_session)
    employee, _ = service.onboard_employee(tenant.id, _payload())

    deactivated = service.set_status(tenant.id, employee.id, EmployeeStatus.INACTIVE)
    assert deactivated.status == EmployeeStatus.INACTIVE

    reactivated = service.set_status(tenant.id, employee.id, EmployeeStatus.ACTIVE)
    assert reactivated.status == EmployeeStatus.ACTIVE


def test_set_status_rejects_invited_target(db_session, make_tenant) -> None:
    tenant, _ = make_tenant(enabled_modules=["recruitment"])
    service = EmployeeService(db_session)
    employee, _ = service.onboard_employee(tenant.id, _payload())

    with pytest.raises(AppError):
        service.set_status(tenant.id, employee.id, EmployeeStatus.INVITED)


def test_reissue_invitation_expires_prior_pending_invitation(db_session, make_tenant) -> None:
    from app.core.security import hash_token

    tenant, _ = make_tenant(enabled_modules=["recruitment"])
    service = EmployeeService(db_session)
    employee, original_token = service.onboard_employee(tenant.id, _payload())

    _, new_token = service.reissue_invitation(tenant.id, employee.id)

    assert new_token != original_token
    original = service.invitations.get_by_token_hash(hash_token(original_token))
    assert original.expires_at < service.invitations.get_by_token_hash(
        hash_token(new_token)
    ).expires_at


def test_bulk_onboard_employees_isolates_row_failures(db_session, make_tenant) -> None:
    tenant, _ = make_tenant(employee_id_prefix="DOM", enabled_modules=["recruitment"])
    service = EmployeeService(db_session)
    service.onboard_employee(tenant.id, _payload(work_email="existing@example.com"))

    results = service.bulk_onboard_employees(
        tenant.id,
        [
            _payload(work_email="new1@example.com"),
            _payload(work_email="existing@example.com"),  # duplicate -> fails
            _payload(work_email="new2@example.com"),
        ],
    )

    assert [r.status for r in results] == ["created", "failed", "created"]
    assert results[0].employee.employee_code == "DOM-EMP-00002"
    assert results[2].employee.employee_code == "DOM-EMP-00003"  # no gap from the failed row


def test_get_summary_computes_counts_and_avg_permission_pct(db_session, make_tenant) -> None:
    tenant, _ = make_tenant(enabled_modules=["recruitment", "clients"])  # denominator = 2*4 = 8
    service = EmployeeService(db_session)
    first, _ = service.onboard_employee(
        tenant.id,
        _payload(
            work_email="a@example.com",
            permissions=[EmployeePermissionIn(module="recruitment", actions=["CREATE", "READ"])],
        ),
    )
    service.onboard_employee(tenant.id, _payload(work_email="b@example.com", permissions=[]))
    service.set_status(tenant.id, first.id, EmployeeStatus.ACTIVE)

    summary = service.get_summary(tenant.id)

    assert summary.total == 2
    assert summary.active == 1
    assert summary.invited == 1
    assert summary.inactive == 0
    # 2 granted actions across 2 employees * 8 possible actions each = 16 possible
    assert summary.avg_permission_grant_pct == round(2 / 16 * 100, 1)


def test_update_employee_changes_name_email_role(db_session, make_tenant) -> None:
    tenant, _ = make_tenant(enabled_modules=["recruitment"])
    service = EmployeeService(db_session)
    employee, _ = service.onboard_employee(tenant.id, _payload())

    updated = service.update_employee(
        tenant.id,
        employee.id,
        EmployeeUpdateRequest(
            first_name="Janet", last_name="Doe", email="janet.doe@example.com", role="HR"
        ),
    )

    assert updated.first_name == "Janet"
    assert updated.email == "janet.doe@example.com"
    assert updated.role == "HR"


def test_update_employee_persists_employment_and_profile_fields(db_session, make_tenant) -> None:
    tenant, _ = make_tenant(enabled_modules=["recruitment"])
    service = EmployeeService(db_session)
    employee, _ = service.onboard_employee(tenant.id, _payload())

    updated = service.update_employee(
        tenant.id,
        employee.id,
        EmployeeUpdateRequest(
            first_name="Jane",
            last_name="Doe",
            email="jane.doe@example.com",
            role="RECRUITER",
            department="Recruitment",
            designation="Senior Recruiter",
            phone="+14155552671",
            city="Austin",
        ),
    )

    assert updated.department == "Recruitment"
    assert updated.designation == "Senior Recruiter"
    assert updated.phone == "+14155552671"
    assert updated.city == "Austin"


def test_update_employee_omitted_fields_are_left_untouched(db_session, make_tenant) -> None:
    """A request that only sends the four identity fields (the quick-edit
    dialog) must never blank out employment/profile data set earlier."""
    tenant, _ = make_tenant(enabled_modules=["recruitment"])
    service = EmployeeService(db_session)
    employee, _ = service.onboard_employee(
        tenant.id, _payload(department="Recruitment", city="Austin")
    )

    updated = service.update_employee(
        tenant.id,
        employee.id,
        EmployeeUpdateRequest(
            first_name="Jane", last_name="Doe", email="jane.doe@example.com", role="RECRUITER"
        ),
    )

    assert updated.department == "Recruitment"
    assert updated.city == "Austin"
