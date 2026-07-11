import asyncio
import json
import os
import sys

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import async_session
from app.models.category import Category
from app.models.tool import Tool
from sqlalchemy.future import select

async def get_or_create_category(session, cat_data):
    # Check if category exists
    cat_name = cat_data.get("name", "")
    query = select(Category).where(Category.name == cat_name)
    result = await session.execute(query)
    category = result.scalars().first()
    
    if not category:
        category = Category(
            name=cat_name,
            description=cat_data.get("description", ""),
            emoji=cat_data.get("emoji", ""),
            order=cat_data.get("order", 99),
            slug=cat_name.lower().replace(" ", "-").replace("&", "and")
        )
        session.add(category)
        await session.commit()
        await session.refresh(category)
    return category

async def seed_data():
    print("Initializing Database Seeding...")
    
    # Path to static frontend JSON
    static_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data")
    categories_file = os.path.join(static_dir, "categories.json")
    tools_file = os.path.join(static_dir, "tools.json")
    
    if not os.path.exists(categories_file) or not os.path.exists(tools_file):
        print(f"Error: Static JSON files not found in {static_dir}")
        return

    async with async_session() as session:
        # Load Categories
        with open(categories_file, 'r', encoding='utf-8') as f:
            categories_data = json.load(f)
            
        print(f"Loaded {len(categories_data)} categories from JSON.")
        
        # Load Tools
        with open(tools_file, 'r', encoding='utf-8') as f:
            tools_data = json.load(f)
            
        print(f"Loaded {len(tools_data)} tools from JSON.")
        
        # Seed Categories
        cat_map = {}
        for c_data in categories_data:
            cat = await get_or_create_category(session, c_data)
            cat_map[cat.name] = cat.id
            
        # Seed Tools
        for t_data in tools_data:
            slug = t_data.get("id") or t_data.get("name", "").lower().replace(" ", "-")
            
            # Check if tool exists
            query = select(Tool).where(Tool.slug == slug)
            result = await session.execute(query)
            tool = result.scalars().first()
            
            if not tool:
                tool = Tool(
                    name=t_data.get("name"),
                    slug=slug,
                    description=t_data.get("description"),
                    category_id=cat_map.get(t_data.get("category")),
                    keywords=t_data.get("keywords", []),
                    tags=t_data.get("tags", []),
                    aliases=t_data.get("aliases", []),
                    synonyms=t_data.get("synonyms", []),
                    icon_url=t_data.get("icon", ""),
                    url_path=t_data.get("url", ""),
                    is_active=True,
                    is_featured=t_data.get("featured", False),
                    version="1.0.0"
                )
                session.add(tool)
        
        await session.commit()
        print("Successfully seeded all Tools and Categories!")

if __name__ == "__main__":
    asyncio.run(seed_data())
