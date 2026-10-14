"""Command-line entry point for building/updating the local document index."""

import logging

from rag import ingest_documents


def main() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )
    result = ingest_documents()
    print(
        f"Ingestion complete: {result['documents']} document(s), "
        f"{result['chunks']} chunk(s), {result['removed']} stale chunk(s) removed."
    )


if __name__ == "__main__":
    main()
