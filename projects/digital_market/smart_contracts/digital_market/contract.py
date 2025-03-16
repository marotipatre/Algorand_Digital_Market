from algopy import *
from algopy.arc4 import abimethod


class DigitalMarket(ARC4Contract):
    assetid: UInt64
    unitaryprice: UInt64

    #create the app
    @abimethod(allow_actions=["NoOp"], create="require")
    def create_application(self, asset_id: Asset, unitary_price: UInt64) -> None:
        self.assetid = asset_id.id
        self.unitaryprice = unitary_price

    #update the listing price
    @abimethod()
    def set_price(self, unitary_price: UInt64) -> None:
        assert Txn.sender == Global.creator_address
        self.unitaryprice = unitary_price

    # opt in to the asset that will be sold
    @abimethod()
    def opt_in_to_asset(self, mbrpay: gtxn.PaymentTransaction) -> None:
        assert Txn.sender == Global.creator_address
        assert not Global.current_application_address.is_opted_in(Asset(self.assetid))

        assert mbrpay.receiver == Global.current_application_address

        assert mbrpay.amount == Global.min_balance + Global.asset_opt_in_min_balance

        itxn.AssetTransfer(
            xfer_asset= self.assetid,
            asset_receiver= Global.current_application_address,
            asset_amount= 0,
        ).submit()

       
    # buy the asset
    @abimethod()
    def buy(self, buyerTxn: gtxn.PaymentTransaction, quantity:UInt64) -> None:
        assert buyerTxn.sender == Txn.sender
        assert buyerTxn.receiver == Global.current_application_address
        assert buyerTxn.amount == self.unitaryprice * quantity

        itxn.AssetTransfer(
            xfer_asset= self.assetid,
            asset_receiver= Txn.sender,
            asset_amount= quantity,
        ).submit()

    #delete the app & take your assets and profit back
    @abimethod(allow_actions=["DeleteApplication"])
    def delete_application(self) -> None:
        # Only allow the creator to delete the application
        assert Txn.sender == Global.creator_address

        # Send all the unsold assets to the creator
        itxn.AssetTransfer(
            xfer_asset=self.assetid,
            asset_receiver=Global.creator_address,
            # The amount is 0, but the asset_close_to field is set
            # This means that ALL assets are being sent to the asset_close_to address
            asset_amount=0,
            # Close the asset to unlock the 0.1 ALGO that was locked in opt_in_to_asset
            asset_close_to=Global.creator_address,
            fee=1_000,
        ).submit()

        # Send the remaining balance to the creator
        itxn.Payment(
            receiver=Global.creator_address,
            amount=0,
            # Close the account to get back ALL the ALGO in the account
            close_remainder_to=Global.creator_address,
            fee=1_000,
        ).submit()

