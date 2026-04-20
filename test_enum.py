import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def main():
    engine = create_async_engine('postgresql+asyncpg://postgres:postgres@localhost:5432/peaktalk')
    async with engine.begin() as conn:
        print("Checking if enum exists")
        result = await conn.execute(text("SELECT 1 FROM pg_type WHERE typname = 'scenario_category'"))
        exists = result.scalar() is not None
        print(f"Exists: {exists}")
        
asyncio.run(main())
