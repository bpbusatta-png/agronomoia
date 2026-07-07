from models.papel import Papel
from models.usuario import Usuario
from models.cooperado import Cooperado
from models.empresa import Empresa
from models.fazenda import Fazenda
from models.safra import Safra
from models.cultivar import Cultivar
from models.talhao import Talhao
from models.contrato import Contrato
from models.inspecao import Inspecao
from models.aplicacao import Aplicacao
from models.historico_climatico import HistoricoClimatico
from models.analise_solo import AnaliseSolo
from models.fotografia import Fotografia
from models.modelo_versao import ModeloVersao
from models.praga_catalogo import PragaCatalogo
from models.doenca_catalogo import DoencaCatalogo
from models.planta_daninha_catalogo import PlantaDaninhaCatalogo
from models.ocorrencia_praga import OcorrenciaPraga
from models.ocorrencia_doenca import OcorrenciaDoenca
from models.ocorrencia_planta_daninha import OcorrenciaPlantaDaninha
from models.planta_atipica_ocorrencia import PlantaAtipicaOcorrencia
from models.ndvi_leitura import NdviLeitura
from models.produtividade_estimativa import ProdutividadeEstimativa
from models.colheita import Colheita
from models.validacao_humana import ValidacaoHumana
from models.dataset_rotulo import DatasetRotulo
from models.log_predicao_ia import LogPredicaoIA
from models.consentimento_lgpd import ConsentimentoLgpd
from models.sincronizacao_log import SincronizacaoLog

__all__ = [
    "Papel",
    "Usuario",
    "Cooperado",
    "Empresa",
    "Fazenda",
    "Safra",
    "Cultivar",
    "Talhao",
    "Contrato",
    "Inspecao",
    "Aplicacao",
    "HistoricoClimatico",
    "AnaliseSolo",
    "Fotografia",
    "ModeloVersao",
    "PragaCatalogo",
    "DoencaCatalogo",
    "PlantaDaninhaCatalogo",
    "OcorrenciaPraga",
    "OcorrenciaDoenca",
    "OcorrenciaPlantaDaninha",
    "PlantaAtipicaOcorrencia",
    "NdviLeitura",
    "ProdutividadeEstimativa",
    "Colheita",
    "ValidacaoHumana",
    "DatasetRotulo",
    "LogPredicaoIA",
    "ConsentimentoLgpd",
    "SincronizacaoLog",
]
