# Reglas de Formato - Documentación Completa

Format Rules
Rule name Servicios
Rule name Servicios
Format these columns and
actions Nombre_Item
For this data Catalogo
If this condition is true =[Categoria] = "Servicios"
Rule order 1
Is this format rule disabled?No
Like this
{"textColor":"themeMainColor","highlightColor":null,"textSize":
1.0,"underline":false,"strikethrough":false,"bold":true,"italic":fal
se,"uppercase":true,"icon":"fal fa-briefcase","imageSize":null}
20/4/26, 3:25 p.m. Application Documentation
https://www.appsheet.com/template/appdoc?appId=da2e1cc5-247f-490a-ae15-408ace2ab96c 87/102

Visible? ALWAYS
Rule name Gastos Fijos
Rule name Gastos Fijos
Format these columns and
actions Categoria
For this data Catalogo
If this condition is true =[Categoria] = "Gastos Fijos"
Rule order 1
Is this format rule disabled?No
Like this
{"textColor":"minorText","highlightColor":"minorText","textSize"
:1.0,"underline":false,"strikethrough":false,"bold":true,"italic":fal
se,"uppercase":true,"icon":"fal fa-store-alt","imageSize":null}
Visible? ALWAYS
Rule name Gastos
Rule name Gastos
Format these columns and
actions
Detalle_Adicional
Fecha_Vencimiento
For this data Transacciones
If this condition is true =[Tipo_Movimiento] = "Gasto"
Rule order 1
Is this format rule disabled?No
Like this
{"textColor":"red","highlightColor":null,"textSize":1.1,"underline"
:false,"strikethrough":false,"bold":true,"italic":false,"uppercase":
false,"icon":"fas fa-engine-warning","imageSize":null}
Visible? ALWAYS
Rule name Ingresos
Rule name Ingresos
Format these columns and
actions Fecha
For this data Transacciones
If this condition is true =[Tipo_Movimiento] = "Ingreso"
Rule order 1
Is this format rule disabled?No
Like this
{"textColor":"green","highlightColor":"","textSize":1.0,"underline"
:false,"strikethrough":false,"bold":true,"italic":false,"uppercase":
false,"icon":"fas fa-hand-holding-usd","imageSize":null}
Visible? ALWAYS
Rule name Estado_Pagado
Rule name Estado_Pagado
20/4/26, 3:25 p.m. Application Documentation
https://www.appsheet.com/template/appdoc?appId=da2e1cc5-247f-490a-ae15-408ace2ab96c 88/102

Format these columns and
actions
Estado_Pago
Total_Facturado
For this data Transacciones
If this condition is true =[Estado_Pago] = "Pagado"
Rule order 1
Is this format rule disabled?No
Like this
{"textColor":"green","highlightColor":"green","textSize":1.1,"und
erline":false,"strikethrough":false,"bold":true,"italic":false,"uppe
rcase":true,"icon":"fas fa-check-circle","imageSize":null}
Visible? ALWAYS
Rule name Estado_Pendiente
Rule name Estado_Pendiente
Format these columns and
actions
Estado_Pago
Total_Facturado
For this data Transacciones
If this condition is true =[Estado_Pago] = "Pendiente"
Rule order 1
Is this format rule disabled?No
Like this
{"textColor":"orange","highlightColor":"orange","textSize":1.0,"u
nderline":false,"strikethrough":false,"bold":false,"italic":false,"u
ppercase":false,"icon":"fas fa-clock","imageSize":null}
Visible? ALWAYS
Rule name Color_Ingreso
Rule name Color_Ingreso
Format these columns and
actions
Tipo_Movimiento
Total_Facturado
For this data Transacciones
If this condition is true =[Tipo_Movimiento] = "Ingreso"
Rule order 1
Is this format rule disabled?No
Like this
{"textColor":"","highlightColor":"green","textSize":1.0,"underline"
:false,"strikethrough":false,"bold":false,"italic":false,"uppercase
":true,"icon":"far fa-arrow-alt-circle-up","imageSize":null}
Visible? ALWAYS
Rule name Color_Gasto
Rule name Color_Gasto
Format these columns and
actions
Tipo_Movimiento
Total_Facturado
For this data Transacciones
If this condition is true =[Tipo_Movimiento] = "Gasto"
Rule order 1
Is this format rule disabled?No
20/4/26, 3:25 p.m. Application Documentation
https://www.appsheet.com/template/appdoc?appId=da2e1cc5-247f-490a-ae15-408ace2ab96c 89/102

Like this
{"textColor":null,"highlightColor":"red","textSize":1.0,"underline"
:false,"strikethrough":false,"bold":true,"italic":false,"uppercase":
true,"icon":"far fa-shopping-cart","imageSize":null}
Visible? ALWAYS
Rule name Icono_SINPE
Rule name Icono_SINPE
Format these columns and
actions
Fecha
Resumen_Gestion_Pago
For this data Transacciones
If this condition is true =[Metodo_Pago] = "Sinpe"
Rule order 1
Is this format rule disabled?No
Like this
{"textColor":"","highlightColor":"","textSize":1.1,"underline":false,
"strikethrough":false,"bold":true,"italic":false,"uppercase":false,
"icon":"far fa-mobile-alt","imageSize":null}
Visible? ALWAYS
Rule name Icono_ Tarjeta
Rule name Icono_ Tarjeta
Format these columns and
actions
Fecha
Resumen_Gestion_Pago
For this data Transacciones
If this condition is true =[Metodo_Pago] = "Tarjeta"
Rule order 1
Is this format rule disabled?No
Like this
{"textColor":null,"highlightColor":"","textSize":1.1,"underline":fal
se,"strikethrough":false,"bold":true,"italic":false,"uppercase":tru
e,"icon":"far fa-credit-card","imageSize":null}
Visible? ALWAYS
Rule name Icono_Transferencia
Rule name Icono_Transferencia
Format these columns and
actions
Fecha
Resumen_Gestion_Pago
For this data Transacciones
If this condition is true =[Metodo_Pago] = "Transferencia"
Rule order 1
Is this format rule disabled?No
Like this
{"textColor":null,"highlightColor":null,"textSize":1.0,"underline":f
alse,"strikethrough":false,"bold":true,"italic":false,"uppercase":f
alse,"icon":"fas fa-university","imageSize":null}
Visible? ALWAYS
Rule name Icono_Efectivo
20/4/26, 3:25 p.m. Application Documentation
https://www.appsheet.com/template/appdoc?appId=da2e1cc5-247f-490a-ae15-408ace2ab96c 90/102

Rule name Icono_Efectivo
Format these columns and
actions
Fecha
Resumen_Gestion_Pago
For this data Transacciones
If this condition is true =[Metodo_Pago] = "Efectivo"
Rule order 1
Is this format rule disabled?No
Like this
{"textColor":null,"highlightColor":null,"textSize":1.1,"underline":f
alse,"strikethrough":false,"bold":true,"italic":false,"uppercase":t
rue,"icon":"far fa-coins","imageSize":null}
Visible? ALWAYS
Rule name Estado_Vencido
Rule name Estado_Vencido
Format these columns and
actions
Estado_Pago
Fecha_Vencimiento
Total_Facturado
Sugerencia_Accion
For this data Transacciones
If this condition is true =[Estado_Pago] = "Vencido"
Rule order 1
Is this format rule disabled?No
Like this
{"textColor":"red","highlightColor":"red","textSize":1.0,"underlin
e":false,"strikethrough":false,"bold":true,"italic":false,"uppercas
e":false,"icon":"fas fa-bomb","imageSize":null}
Visible? ALWAYS
Rule name Productos
Rule name Productos
Format these columns and
actions Nombre_Item
For this data Catalogo
If this condition is true =[Categoria] = "Productos"
Rule order 1
Is this format rule disabled?No
Like this
{"textColor":"purple","highlightColor":"purple","textSize":1.0,"un
derline":false,"strikethrough":false,"bold":true,"italic":false,"upp
ercase":true,"icon":"fas fa-box-check","imageSize":null}
Visible? ALWAYS
20/4/26, 3:25 p.m. Application Documentation
https://www.appsheet.com/template/appdoc?appId=da2e1cc5-247f-490a-ae15-408ace2ab96c 91/102

