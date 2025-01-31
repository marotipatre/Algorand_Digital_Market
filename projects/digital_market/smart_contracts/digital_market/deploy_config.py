import logging

import algokit_utils
from algosdk.v2client.algod import AlgodClient
from algosdk.v2client.indexer import IndexerClient

logger = logging.getLogger(__name__)


# define deployment behaviour based on supplied app spec
def deploy(
    algod_client: AlgodClient,
    indexer_client: IndexerClient,
    app_spec: algokit_utils.ApplicationSpecification,
    deployer: algokit_utils.Account,
) -> None:
    from smart_contracts.artifacts.digital_market.digital_market_client import (
        DigitalMarketClient,
    )

    app_client = DigitalMarketClient(
        algod_client,
        creator=deployer,
        indexer_client=indexer_client,
    )

    app_client.create_create_application(asset_id=0, unitary_price=3)

    logger.info(f"Application Deployed Successfully with APP ID : {app_client.app_id}")
