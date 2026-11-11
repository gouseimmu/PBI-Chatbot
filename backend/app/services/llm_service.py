from abc import ABC, abstractmethod
from typing import Dict, Any

from ..config import settings
from ..prompts import SYSTEM_PROMPT

import logging

logger = logging.getLogger(__name__)


class ConfigurationError(RuntimeError):
    pass


class OpenAIError(RuntimeError):
    def __init__(
        self,
        message: str,
        status: int | None = None,
        error_type: str | None = None,
    ):
        super().__init__(message)
        self.status = status
        self.error_type = error_type


class LLMProvider(ABC):

    @abstractmethod
    def ask(
        self,
        question: str,
        context: Dict[str, Any],
    ) -> Dict[str, Any]:
        raise NotImplementedError()


class OpenAIProvider(LLMProvider):

    def __init__(self, model: str = None):
        self.model = model or settings.AZURE_OPENAI_DEPLOYMENT

        if not settings.AZURE_OPENAI_API_KEY:
            raise ConfigurationError(
                "Azure OpenAI API key is not configured."
            )

        if not settings.AZURE_OPENAI_ENDPOINT:
            raise ConfigurationError(
                "Azure OpenAI endpoint is not configured."
            )

        try:
            from openai import AzureOpenAI

            self.client = AzureOpenAI(
                api_key=settings.AZURE_OPENAI_API_KEY,
                azure_endpoint=settings.AZURE_OPENAI_ENDPOINT,
                api_version="2024-10-21",
            )

        except ImportError as exc:
            logger.exception("OpenAI SDK is not installed")
            raise ConfigurationError(
                "OpenAI SDK is not installed."
            ) from exc

        except Exception as exc:
            logger.exception("Failed to initialize Azure OpenAI client")
            raise ConfigurationError(
                f"Failed to initialize Azure OpenAI client: {exc}"
            ) from exc

    def _build_prompt(
        self,
        question: str,
        context: Dict[str, Any],
    ) -> str:

        return (
            SYSTEM_PROMPT
            + "\n\nContext:\n"
            + str(context)
            + "\n\nQuestion:\n"
            + question
        )

    def ask(
        self,
        question: str,
        context: Dict[str, Any],
    ) -> Dict[str, Any]:

        prompt = self._build_prompt(question, context)

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "user",
                        "content": prompt,
                    }
                ],
            )

            text = ""

            if response.choices:
                text = (
                    response.choices[0]
                    .message
                    .content
                    or ""
                ).strip()

            return {
                "answer": text,
                "source": "powerbi_dataset",
                "model": self.model,
            }

        except Exception as exc:
            logger.exception("Azure OpenAI request failed")

            status = getattr(exc, "status_code", None)
            error_type = getattr(exc, "code", None)
            detail = None

            if hasattr(exc, "body") and isinstance(exc.body, dict):
                error_data = exc.body.get("error", {})

                if isinstance(error_data, dict):
                    detail = error_data.get("message")
                    error_type = (
                        error_type
                        or error_data.get("type")
                    )

            message_parts = ["Azure OpenAI API error:"]

            if status is not None:
                message_parts.append(
                    f"status={status}"
                )

            if error_type is not None:
                message_parts.append(
                    f"type={error_type}"
                )

            if detail:
                message_parts.append(
                    f"message={detail}"
                )

            raise OpenAIError(
                " ".join(message_parts).strip(),
                status=status,
                error_type=error_type,
            ) from exc