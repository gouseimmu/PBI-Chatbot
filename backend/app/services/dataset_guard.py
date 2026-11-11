from typing import Dict, Any


class DatasetGuard:
    """Simple guard that checks whether the question mentions dataset fields or measures."""

    def check(self, question: str, data_context) -> Dict[str, Any]:
        context = data_context.model_dump() if hasattr(data_context, 'model_dump') else data_context

        dataset = context.get("dataset", {})

        fields = [
            f.get("name", "").lower()
            for f in dataset.get("fields", [])
        ]

        measures = [
            m.get("name", "").lower()
            for m in dataset.get("measures", [])
        ]

        question_lower = question.lower()

        tokens = fields + measures

        matched = any(
            token and token in question_lower
            for token in tokens
        )

        if matched:
            return {
                "allowed": True,
                "reason": "Question appears related to the Power BI dataset."
            }

        return {
            "allowed": True,
            "reason": "No direct field match found; allowing LLM evaluation."
        }
