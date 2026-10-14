import os

from shop.services.session import get_session


def shop_globals(request):
    session = get_session(request)
    return {
        "shop_session": session,
        "currency_symbol": os.environ.get("CURRENCY_SYMBOL", "$"),
    }
