from typing import Annotated, Optional

from geoalchemy2.elements import WKBElement
from geoalchemy2.shape import to_shape
from pydantic import BeforeValidator


def _geom_to_wkt(v):
    if isinstance(v, WKBElement):
        return to_shape(v).wkt
    return v


# Geometrias trafegam como texto WKT (ex.: "POINT(-51.23 -29.12)").
# O geoalchemy2 converte a string automaticamente ao gravar; na leitura,
# o valor bindado pelo SQLAlchemy é um WKBElement, convertido aqui.
WKTGeometry = Annotated[Optional[str], BeforeValidator(_geom_to_wkt)]
