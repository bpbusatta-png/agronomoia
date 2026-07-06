from core.deps import require_roles

ADMINISTRADOR = "Administrador"
AGRONOMO_RT = "Agronomo_RT"
TECNICO_CAMPO = "Tecnico_Campo"
COOPERADO = "Cooperado"
CONSULTA = "Consulta"

admin_only = require_roles(ADMINISTRADOR)
admin_ou_rt = require_roles(ADMINISTRADOR, AGRONOMO_RT)
campo_ou_rt_ou_admin = require_roles(ADMINISTRADOR, AGRONOMO_RT, TECNICO_CAMPO)
