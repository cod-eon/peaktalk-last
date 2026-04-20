import asyncio
import logging

from app.database import AsyncSessionLocal
from app.seeds.scenarios import seed_scenarios


logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")


async def main() -> None:
    async with AsyncSessionLocal() as db:
        inserted = await seed_scenarios(db)
        logging.info("Inserted %s scenarios", inserted)


if __name__ == "__main__":
    asyncio.run(main())
