import asyncio
import logging
from contextlib import asynccontextmanager

from app.api.routes.auth import router as auth_router
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.accounts import router as accounts_router
from app.api.routes.assets import router as assets_router
from app.api.routes.health import router as health_router
from app.api.routes.news import router as news_router
from app.api.routes.orders import router as orders_router
from app.api.routes.positions import router as positions_router
from app.api.routes.portfolio import router as portfolio_router
from app.api.routes.research import router as research_router
from app.api.routes.risk import router as risk_router
from app.api.routes.signals import router as signals_router
from app.api.routes.snapshots import router as snapshots_router
from app.api.routes.system_settings import router as system_settings_router
from app.api.routes.users import router as users_router
from app.core.config import settings

logger = logging.getLogger(__name__)


def _prewarm_imports() -> None:
    logger.info("Pre-warming tradingagents imports...")
    try:
        import tradingagents.graph.trading_graph  # noqa: F401
        from cli.main import save_report_to_disk  # noqa: F401
        logger.info("Pre-warming complete.")
    except Exception:
        logger.warning("Pre-warming failed (will import lazily on first request)", exc_info=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    asyncio.get_event_loop().run_in_executor(None, _prewarm_imports)
    yield


app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(auth_router)
app.include_router(accounts_router)
app.include_router(assets_router)
app.include_router(news_router)
app.include_router(positions_router)
app.include_router(research_router)
app.include_router(signals_router)
app.include_router(risk_router)
app.include_router(orders_router)
app.include_router(portfolio_router)
app.include_router(snapshots_router)
app.include_router(system_settings_router)
app.include_router(users_router)
