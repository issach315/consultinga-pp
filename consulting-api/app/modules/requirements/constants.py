from enum import StrEnum

REQUIREMENTS_MODULE_KEY = "requirements"


class RequirementsSubModule(StrEnum):
    CLIENTS = "clients"
    REQUIREMENTS = "requirements"
    SUBMISSIONS = "submissions"
    INTERVIEWS = "interviews"
    PLACEMENTS = "placements"
    BENCH = "bench"


REQUIREMENTS_SUB_MODULE_KEYS: list[str] = [m.value for m in RequirementsSubModule]

REQUIREMENTS_SUB_MODULE_LABELS: dict[str, str] = {
    RequirementsSubModule.CLIENTS: "Clients",
    RequirementsSubModule.REQUIREMENTS: "Requirements",
    RequirementsSubModule.SUBMISSIONS: "Submissions",
    RequirementsSubModule.INTERVIEWS: "Interviews",
    RequirementsSubModule.PLACEMENTS: "Placements",
    RequirementsSubModule.BENCH: "Bench",
}
