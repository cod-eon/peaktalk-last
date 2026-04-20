import logging
from openfeature import api
from devcycle_python_sdk.options import DevCycleLocalOptions
from devcycle_python_sdk import DevCycleLocalClient

logger = logging.getLogger(__name__)

# Assuming config handles DEVCYCLE_SERVER_SDK_KEY
from app.config import settings

devcycle_client = None

def init_feature_flags():
    global devcycle_client
    
    if not settings.devcycle_server_sdk_key:
        logger.warning("DEVCYCLE_SERVER_SDK_KEY not found. Feature flags will be unavailable.")
        return

    logger.info("Initializing DevCycle OpenFeature Provider...")
    
    try:
        options = DevCycleLocalOptions()
        devcycle_client = DevCycleLocalClient(
            settings.devcycle_server_sdk_key, 
            options
        )
        # Note: the openfeature provider is built-in the devcycle SDK Client
        api.set_provider(devcycle_client.get_openfeature_provider())
        logger.info("DevCycle OpenFeature Provider initialized successfully.")
    except Exception as e:
        logger.error(f"Failed to initialize DevCycle: {e}")

def close_feature_flags():
    global devcycle_client
    if devcycle_client:
        logger.info("Closing DevCycle client...")
        devcycle_client.close()
        devcycle_client = None
