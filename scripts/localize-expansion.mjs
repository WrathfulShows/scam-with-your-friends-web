import fs from 'node:fs';
// Columns: Chinese | English | Brazilian Portuguese | Japanese | Spanish.
const rows=`
客户关怀|Customer care|Atenção ao cliente|顧客ケア|Atención al cliente
每通电话多 35 秒；疑虑消退更快。适合仔细探索。|35 extra seconds per call; suspicion fades faster. Time to investigate.|Mais 35 segundos por ligação; a desconfiança diminui mais rápido.|通話ごとに35秒追加。不信感が早く下がり、調査に集中できます。|35 segundos extra por llamada; la desconfianza baja más rápido.
效率竞赛|Efficiency race|Corrida de eficiência|効率競争|Carrera de eficiencia
每笔收入增加 25%，但耐心减少 15 秒。|Earn 25% more per case, with 15 seconds less patience.|Ganhe 25% a mais por caso, com 15 segundos a menos de paciência.|報酬が25%増加。相手の待ち時間は15秒短縮。|Gana un 25% más por caso, con 15 segundos menos de paciencia.
混乱奖金|Chaos bonus|Bônus de caos|混乱ボーナス|Bono de caos
每笔收入增加 40%，事故更频繁。|Earn 40% more per case. Incidents happen more often.|Ganhe 40% a mais por caso. Incidentes são mais frequentes.|報酬が40%増加。トラブルがより頻繁に発生。|Gana un 40% más por caso. Los incidentes son más frecuentes.
了解顾虑|Understand concerns|Entender as preocupações|不安を聞く|Entender las preocupaciones
请告诉我你最担心的问题，以及通知上描述的情况。|Tell me what worries you and what the notice says.|Conte o que preocupa você e o que diz o aviso.|心配な点と通知に書かれた状況を教えてください。|Cuéntame qué te preocupa y qué dice el aviso.
解释方案|Explain the plan|Explicar o plano|手順を説明する|Explicar el plan
我先解释处理方案：只核对这份通知的内容，不更改其他资料。你可以随时停止。|Let me explain the plan: we only check this notice and change nothing else. You can stop at any time.|Vou explicar o plano: só conferimos este aviso, sem alterar outros dados. Você pode parar quando quiser.|手順を説明します。この通知だけを確認し、他の情報は変更しません。いつでも中止できます。|Te explico el plan: solo revisamos este aviso, sin cambiar otros datos. Puedes parar cuando quieras.
确认意愿|Confirm consent|Confirmar o consentimento|続行の意思を確認|Confirmar el consentimiento
你理解刚才的步骤了吗？如果愿意继续，请找到通知上的参考编号。|Are the steps clear? If you agree to continue, find the reference on your notice.|Os passos ficaram claros? Se concordar em continuar, encontre a referência no aviso.|手順は理解できましたか？続けてよければ、通知の参照番号を探してください。|¿Han quedado claros los pasos? Si aceptas continuar, busca la referencia del aviso.
蓝|Blue|Azul|青|Azul
绿|Green|Verde|緑|Verde
橙|Orange|Laranja|オレンジ|Naranja
比对档案|Compare records|Comparar registros|記録を照合|Comparar registros
处理冲突|Resolve the conflict|Resolver o conflito|矛盾を解消|Resolver el conflicto
旧地址已撤销，新通知已签收。选择应保留的版本。|The old address was revoked; the new notice was received. Choose the version to keep.|O endereço antigo foi revogado; o novo aviso foi recebido. Escolha a versão correta.|旧住所は無効、新しい通知は受領済み。残す記録を選びましょう。|La dirección antigua fue anulada; el nuevo aviso fue recibido. Elige qué versión conservar.
保留旧地址|Keep the old address|Manter o endereço antigo|旧住所を残す|Conservar la dirección antigua
保留已签收的新通知|Keep the received new notice|Manter o novo aviso recebido|受領済みの新通知を残す|Conservar el nuevo aviso recibido
删除所有档案|Delete all records|Excluir todos os registros|記録をすべて削除|Eliminar todos los registros
对账|Reconcile the ledger|Conferir o livro-caixa|帳簿を照合|Conciliar el registro
打开正确目录|Open the right folder|Abrir a pasta correta|正しいフォルダーを開く|Abrir la carpeta correcta
恢复任务文件|Recover the case file|Recuperar o arquivo do caso|案件ファイルを復元|Recuperar el archivo del caso
关闭模拟连接|Close the simulated connection|Encerrar a conexão simulada|模擬接続を終了|Cerrar la conexión simulada
任务已恢复，撤销临时连接后完成交接。|The case is recovered. Revoke the temporary connection to finish the handoff.|O caso foi recuperado. Revogue a conexão temporária para concluir a transferência.|案件を復元しました。一時接続を解除して引き継ぎを完了します。|El caso se ha recuperado. Revoca la conexión temporal para terminar el traspaso.
保持连接|Keep connected|Manter a conexão|接続を維持|Mantener la conexión
撤销临时连接|Revoke temporary connection|Revogar a conexão temporária|一時接続を解除|Revocar la conexión temporal
拼合券面|Reassemble the voucher|Remontar o vale|券を組み合わせる|Reconstruir el cupón
核对库存|Check stock|Conferir o estoque|在庫を確認|Revisar existencias
安排月球补给|Plan lunar supplies|Planejar suprimentos lunares|月面補給を計画|Planificar suministros lunares
猫咪站请求食物；望远镜与烟花不计入补给。选择这次配送。|The cat station needs food, not telescopes or fireworks. Choose the shipment.|A estação dos gatos precisa de comida, não de telescópios ou fogos. Escolha a remessa.|猫の基地が食料を要請。望遠鏡と花火は補給対象外です。配送品を選びましょう。|La estación de gatos necesita comida, no telescopios ni fuegos artificiales. Elige el envío.
猫粮与饮水|Cat food and water|Ração e água|キャットフードと水|Comida para gatos y agua
观星望远镜|Stargazing telescope|Telescópio astronômico|天体望遠鏡|Telescopio astronómico
庆典烟花|Celebration fireworks|Fogos de celebração|お祝いの花火|Fuegos artificiales
分配箱数|Allocate crates|Distribuir caixas|箱数を配分|Distribuir cajas
阅读玉米预报|Read the corn forecast|Ler a previsão do milho|トウモロコシ予報を読む|Leer el pronóstico del maíz
温室关闭，普通玉米供给下降；冷库储备充足。选择有储备的品种。|The greenhouse is closed; regular corn is scarce. Cold storage is full. Choose the stocked variety.|A estufa fechou; falta milho comum. A câmara fria está cheia. Escolha a variedade disponível.|温室閉鎖で通常品が不足。冷蔵庫には十分な備蓄があります。備蓄品を選びましょう。|El invernadero cerró; escasea el maíz normal. Hay reservas refrigeradas. Elige la variedad disponible.
温室开放，普通玉米收成稳定；冷库断电。选择稳定供给。|The greenhouse is open; regular corn is stable. Cold storage lost power. Choose a reliable supply.|A estufa está aberta; o milho comum está estável. A câmara fria ficou sem energia.|温室は稼働中で通常品が安定。冷蔵庫は停電中です。安定供給を選びましょう。|El invernadero funciona; el maíz normal es estable. La cámara fría no tiene luz. Elige un suministro fiable.
普通玉米|Regular corn|Milho comum|通常のトウモロコシ|Maíz normal
冷库玉米|Cold-storage corn|Milho refrigerado|冷蔵トウモロコシ|Maíz refrigerado
设置仓位|Set allocation|Definir alocação|配分を設定|Definir la asignación
办公室规则：只分配四分之一仓库给本次模拟合约。总容量 100。|Office rule: allocate one quarter of the warehouse to this simulated contract. Total capacity: 100.|Regra: destine um quarto do armazém a este contrato simulado. Capacidade total: 100.|ルール：今回の模擬契約には倉庫の4分の1を配分。総容量は100です。|Regla: asigna un cuarto del almacén a este contrato simulado. Capacidad total: 100.
筛选提名|Screen nominations|Selecionar indicações|候補を選定|Filtrar nominaciones
奖项要求：按时交接，且没有缺勤。只有一位满足。|Requirements: on-time handoff and no absences. Only one person qualifies.|Requisitos: entrega pontual e nenhuma ausência. Só uma pessoa se qualifica.|条件：期限内の引き継ぎと欠勤なし。該当者は1人だけです。|Requisitos: entrega puntual y ninguna ausencia. Solo una persona cumple.
A：按时交接 / 无缺勤|A: on time / no absences|A: pontual / sem ausências|A：期限内／欠勤なし|A: puntual / sin ausencias
B：延迟交接 / 无缺勤|B: late / no absences|B: atraso / sem ausências|B：遅延／欠勤なし|B: tarde / sin ausencias
C：按时交接 / 缺勤|C: on time / absent|C: pontual / com ausência|C：期限内／欠勤あり|C: puntual / con ausencia
排好颁奖程序|Order the award ceremony|Ordenar a premiação|授賞手順を並べる|Ordenar la ceremonia
必须先核对提名，再签署证书，最后发送通知。|Check the nomination first, sign the certificate, then send the notice.|Confira a indicação, assine o certificado e só então envie o aviso.|候補を確認し、証明書に署名してから通知を送ります。|Primero revisa la nominación, luego firma el certificado y envía el aviso.
通知→证书→提名|Notice → Certificate → Nomination|Aviso → Certificado → Indicação|通知→証明書→候補|Aviso → Certificado → Nominación
提名→证书→通知|Nomination → Certificate → Notice|Indicação → Certificado → Aviso|候補→証明書→通知|Nominación → Certificado → Aviso
证书→提名→通知|Certificate → Nomination → Notice|Certificado → Indicação → Aviso|証明書→候補→通知|Certificado → Nominación → Aviso
选择火星航线|Choose a Mars route|Escolher rota para Marte|火星航路を選ぶ|Elegir una ruta a Marte
旅客要求无中转、提供氧气。|The passenger wants a direct route with oxygen.|O passageiro quer rota direta com oxigênio.|乗客の希望は直行便、酸素付きです。|El pasajero quiere una ruta directa con oxígeno.
直达 / 含氧气|Direct / oxygen included|Direto / com oxigênio|直行／酸素付き|Directo / con oxígeno
中转 / 含氧气|Transfer / oxygen included|Conexão / com oxigênio|乗換／酸素付き|Con escala / con oxígeno
直达 / 无氧气|Direct / no oxygen|Direto / sem oxigênio|直行／酸素なし|Directo / sin oxígeno
计算补给|Calculate supplies|Calcular suprimentos|補給量を計算|Calcular suministros
工作站被入侵|Workstation intrusion|Invasão da estação|端末に侵入発生|Intrusión en el equipo
断开模拟连接|Disconnect the simulation|Desconectar a simulação|模擬接続を切断|Desconectar la simulación
隔离可疑程序|Quarantine suspicious software|Isolar programa suspeito|不審プログラムを隔離|Aislar el programa sospechoso
恢复只读备份|Restore read-only backup|Restaurar backup somente leitura|読み取り専用バックアップを復元|Restaurar copia de solo lectura
再次运行附件|Run the attachment again|Executar o anexo novamente|添付ファイルを再実行|Ejecutar el adjunto otra vez
关闭警告窗口|Close the warning|Fechar o aviso|警告を閉じる|Cerrar la advertencia
配电过载|Power overload|Sobrecarga elétrica|電力過負荷|Sobrecarga eléctrica
切断支路|Disconnect the branch circuit|Desligar o circuito secundário|分岐回路を切る|Desconectar el circuito secundario
检查保险丝|Check the fuse|Verificar o fusível|ヒューズを点検|Revisar el fusible
恢复总闸|Restore the main switch|Religar a chave geral|主電源を復旧|Restablecer el interruptor general
强行合闸|Force the switch on|Forçar a chave|強制的に電源を入れる|Forzar el interruptor
用水降温|Cool with water|Resfriar com água|水で冷やす|Enfriar con agua
茶水间冒烟|Smoke in the break room|Fumaça na copa|休憩室で煙が発生|Humo en la sala de descanso
切断危险电源|Cut hazardous power|Cortar a energia perigosa|危険な電源を切る|Cortar la energía peligrosa
使用灭火器|Use the extinguisher|Usar o extintor|消火器を使う|Usar el extintor
继续加热|Keep heating|Continuar aquecendo|加熱を続ける|Seguir calentando
堵住出口|Block the exit|Bloquear a saída|出口を塞ぐ|Bloquear la salida
突袭检查|Surprise inspection|Inspeção surpresa|抜き打ち検査|Inspección sorpresa
保存工作记录|Save work records|Salvar registros de trabalho|作業記録を保存|Guardar registros de trabajo
关闭虚构业务终端|Close fictional business terminals|Fechar terminais fictícios|架空業務の端末を閉じる|Cerrar terminales ficticios
集合清点人员|Assemble and count staff|Reunir e contar a equipe|集合して人数確認|Reunir y contar al personal
删除所有记录|Delete all logs|Excluir todos os registros|全ログを削除|Eliminar todos los registros
锁住出口|Lock the exit|Trancar a saída|出口を施錠|Cerrar la salida con llave
通话目标|Call objective|Objetivo da ligação|通話の目標|Objetivo de la llamada
调查并完成业务|Investigate and finish the case|Investigar e concluir o caso|調査して案件を完了|Investigar y completar el caso
疑虑|Suspicion|Desconfiança|不信感|Desconfianza
业务步骤|Case steps|Etapas do caso|案件手順|Pasos del caso
调查工作台|Investigation desk|Mesa de investigação|調査デスク|Mesa de investigación
案件线索|Case evidence|Pistas do caso|案件の手がかり|Pistas del caso
调查答案|Investigation answer|Resposta da investigação|調査の回答|Respuesta de investigación
核对计算|Check calculation|Conferir cálculo|計算を確認|Comprobar cálculo
游戏卡号|Game card ID|ID do cartão do jogo|ゲームカード番号|ID de tarjeta del juego
安全口令|Security phrase|Frase de segurança|合言葉|Frase de seguridad
到期标记|Expiry marker|Marcador de validade|期限マーカー|Marcador de caducidad
通话参考编号|Call reference|Referência da ligação|通話参照番号|Referencia de llamada
最终验证编号|Final verification reference|Referência de verificação final|最終確認番号|Referencia de verificación final
提交验证|Submit verification|Enviar verificação|確認を送信|Enviar verificación
当前没有事故。|No active incidents.|Nenhum incidente ativo.|現在トラブルはありません。|No hay incidentes activos.
秒内处理|seconds to respond|segundos para agir|秒以内に対応|segundos para actuar
应急流程|Emergency procedure|Procedimento de emergência|緊急対応手順|Procedimiento de emergencia
下一班次的工作方式|Next shift strategy|Estratégia do próximo turno|次のシフトの方針|Estrategia del próximo turno
团队调度|Team dispatch|Coordenação da equipe|チーム配車|Coordinación del equipo
请求转接电话|requests a call transfer|solicita transferir uma ligação|通話転送をリクエスト|solicita transferir una llamada
接听转接|Accept transfer|Aceitar transferência|転送を受ける|Aceptar transferencia
拒绝|Decline|Recusar|拒否|Rechazar
在线|Online|Online|オンライン|En línea
空闲|Idle|Livre|待機中|Libre
暂无共享线索|No shared clues yet|Sem pistas compartilhadas|共有の手がかりなし|Aún no hay pistas compartidas
转接给队友|Transfer to teammate|Transferir ao colega|仲間に転送|Transferir al compañero
协助调查|Assist investigation|Ajudar na investigação|調査を支援|Ayudar a investigar
支援事故|Help with incident|Ajudar no incidente|トラブル対応を支援|Ayudar con el incidente
角色工作坊|Character workshop|Oficina de personagens|キャラクター工房|Taller de personajes
人物工作坊|Character workshop|Oficina de personagens|キャラクター工房|Taller de personajes
姓名|Name|Nome|名前|Nombre
人物背景与语气|Background and tone|História e tom|背景と話し方|Trasfondo y tono
开场顾虑|Opening concern|Preocupação inicial|最初の悩み|Preocupación inicial
添加人物|Add character|Adicionar personagem|人物を追加|Añadir personaje
导入 JSON|Import JSON|Importar JSON|JSONを読み込み|Importar JSON
导出角色库|Export characters|Exportar personagens|人物一覧を書き出し|Exportar personajes
移除角色|Remove character|Remover personagem|人物を削除|Eliminar personaje
录制中|Recording|Gravando|録画中|Grabando
第|Day|Dia|第|Día
天|day|dia|日|día
办公室片段|Office clip|Clipe do escritório|オフィスの映像|Clip de oficina
下载|Download|Baixar|ダウンロード|Descargar
删除|Delete|Excluir|削除|Eliminar
记录办公室名场面|Capture office highlights|Registre momentos do escritório|オフィスの名場面を記録|Graba los mejores momentos
同时录制我的麦克风|Include my microphone|Incluir meu microfone|自分のマイクも録音|Incluir mi micrófono
停止并保存|Stop and save|Parar e salvar|停止して保存|Detener y guardar
录制游戏画面|Record game screen|Gravar tela do jogo|ゲーム画面を録画|Grabar la pantalla del juego
录制我的原声|Record my voice|Gravar minha voz|自分の声を録音|Grabar mi voz
录制与回放|Recordings and replay|Gravações e reprodução|録画と再生|Grabaciones y reproducción
公开办公室|Public offices|Escritórios públicos|公開オフィス|Oficinas públicas
刷新|Refresh|Atualizar|更新|Actualizar
等待开始|Waiting to start|Aguardando início|開始待ち|Esperando el inicio
可中途加入|Join in progress|Entrada durante o jogo|途中参加可能|Se puede entrar en curso
老板考核|Boss review|Avaliação do chefe|上司の評価|Evaluación del jefe
绩效时刻|Review time|Hora da avaliação|評価の時間|Hora de evaluación
目标完成率|of target reached|da meta alcançada|目標達成率|del objetivo alcanzado
累计排障|Incidents resolved|Incidentes resolvidos|累計解決数|Incidentes resueltos
协助队友|Team assists|Ajudas à equipe|チーム支援|Ayudas al equipo
收起老板点评|Dismiss boss commentary|Fechar comentário do chefe|上司のコメントを閉じる|Cerrar comentario del jefe
角色音色|Character voice|Voz do personagem|キャラクターの声|Voz del personaje
默认角色声音|Default character voice|Voz padrão do personagem|標準のキャラクター音声|Voz predeterminada
删除选中音色|Delete selected voice|Excluir voz selecionada|選択した音声を削除|Eliminar voz seleccionada
从 WAV 创建音色|Create voice from WAV|Criar voz a partir de WAV|WAVから音声を作成|Crear voz desde WAV
音色名称|Voice name|Nome da voz|音声名|Nombre de la voz
WAV 样本|WAV sample|Amostra WAV|WAVサンプル|Muestra WAV
正在创建音色…|Creating voice…|Criando voz…|音声を作成中…|Creando voz…
上传并创建音色|Upload and create voice|Enviar e criar voz|アップロードして音声を作成|Subir y crear voz
公开指南|Public guide|Guia público|公開ガイド|Guía pública
玩法与公开指南|Gameplay and public guide|Como jogar e guia público|遊び方と公開ガイド|Cómo jugar y guía pública
打印为办公室道具|Print as office prop|Imprimir como objeto do escritório|オフィスの小道具として印刷|Imprimir como objeto de oficina
在公开大厅招募队友|Recruit in the public lobby|Recrutar no lobby público|公開ロビーで仲間を募集|Reclutar en la sala pública
打开团队调度|Open team dispatch|Abrir coordenação da equipe|チーム調整を開く|Abrir coordinación del equipo
班次即将结束|Shift ending soon|O turno está terminando|まもなくシフト終了|El turno está terminando
班次剩余时间|Shift time remaining|Tempo restante do turno|シフト残り時間|Tiempo restante del turno
本日原声与录屏|Today's voice and screen recordings|Gravações de voz e tela de hoje|本日の音声と画面録画|Grabaciones de voz y pantalla de hoy
画面暂时不可用，请重试。|Graphics unavailable. Please retry.|Gráficos indisponíveis. Tente novamente.|画面を表示できません。再試行してください。|Gráficos no disponibles. Vuelve a intentarlo.
恢复画面|Restore graphics|Restaurar gráficos|画面を復旧|Restaurar gráficos
正在聆听，请说话…|Listening. Please speak…|Ouvindo. Pode falar…|聞いています。話してください…|Escuchando. Habla…
`.trim().split('\n').map(line=>line.split('|'));
const longRows=`
应急超时：损失 15 秒，风险上升。仍需排除事故。|Emergency timeout: 15 seconds lost, risk increased. Resolve the incident.|Tempo esgotado: perdeu 15 segundos e o risco aumentou. Resolva o incidente.|対応時間切れ：15秒失い、リスク上昇。復旧作業を続けてください。|Tiempo agotado: pierdes 15 segundos y aumenta el riesgo. Resuelve el incidente.
先完成业务面板中的调查步骤。|Complete the investigation steps first.|Conclua as etapas da investigação primeiro.|先に調査手順を完了してください。|Completa primero los pasos de investigación.
附件触发了模拟病毒！先到安全中心隔离程序。|The attachment triggered a simulated virus! Quarantine it in Security Center.|O anexo ativou um vírus simulado! Isole-o na Central de Segurança.|添付で模擬ウイルス発生！セキュリティセンターで隔離してください。|¡El adjunto activó un virus simulado! Aíslalo en el Centro de Seguridad.
目录已检查，查看右侧任务线索。|Folder inspected. Check the case clues on the right.|Pasta verificada. Veja as pistas à direita.|フォルダーを確認済み。右側の手がかりを見てください。|Carpeta revisada. Mira las pistas a la derecha.
先检查远程桌面的 note.txt 便签。|Read note.txt on the remote desktop first.|Leia note.txt na área remota primeiro.|先にリモート画面のnote.txtを確認してください。|Primero lee note.txt en el escritorio remoto.
线索不匹配，来电者开始怀疑。重新检查资料。|Clues do not match. The caller is suspicious. Check the evidence again.|As pistas não conferem. A pessoa desconfia. Confira os dados.|手がかりが不一致で相手が疑っています。資料を再確認してください。|Las pistas no coinciden. El interlocutor sospecha. Revisa los datos.
调查步骤已完成。|Investigation step complete.|Etapa da investigação concluída.|調査手順を完了しました。|Paso de investigación completado.
处置顺序错误，查看应急流程后重试。|Wrong response order. Check the emergency procedure and retry.|Ordem incorreta. Confira o procedimento e tente novamente.|対応順序が違います。緊急手順を確認して再試行してください。|Orden incorrecto. Revisa el procedimiento y vuelve a intentarlo.
照片格式无效。|Invalid photo format.|Formato de foto inválido.|写真形式が無効です。|Formato de foto no válido.
办公室最多保留八张打印照片。|The office can hold up to eight printed photos.|O escritório comporta até oito fotos impressas.|印刷した写真は8枚まで置けます。|La oficina admite hasta ocho fotos impresas.
照片已打印到身边，可以拾取和传给队友。|Photo printed beside you. Pick it up and pass it to a teammate.|Foto impressa ao seu lado. Pegue e passe a um colega.|写真をそばに印刷しました。拾って仲間に渡せます。|Foto impresa a tu lado. Recógela y pásala a un compañero.
来电者反复询问你的操作，有可能正在试探工作站。|The caller keeps questioning your actions. They may be probing your workstation.|A pessoa insiste em perguntar sobre suas ações. Pode estar testando sua estação.|相手が操作について繰り返し質問しています。端末を探っているかもしれません。|El interlocutor insiste en preguntar por tus acciones. Puede estar poniendo a prueba tu equipo.
接听对应来电后，案件资料会显示在这里。|Case details appear here when you answer the matching call.|Os detalhes aparecem ao atender a ligação correspondente.|対応する電話を受けると案件資料が表示されます。|Los detalles aparecen al contestar la llamada correspondiente.
等待来电者提供资料|Waiting for caller information|Aguardando informações da pessoa|相手の資料を待機中|Esperando información del interlocutor
先了解顾虑、解释方案并确认意愿。|Understand concerns, explain the plan, then confirm consent.|Entenda as preocupações, explique o plano e confirme o consentimento.|不安を聞き、手順を説明し、続行の意思を確認します。|Entiende las preocupaciones, explica el plan y confirma el consentimiento.
检查便签，寻找目录线索。|Read the note for a folder clue.|Leia a nota para encontrar a pasta.|メモを読んでフォルダーの手がかりを探します。|Lee la nota para encontrar la carpeta.
调查完成，可以提交最终验证。|Investigation complete. Submit final verification.|Investigação concluída. Envie a verificação final.|調査完了。最終確認を送信できます。|Investigación completa. Envía la verificación final.
所有文件和代币仅存在于游戏中。|All files and tokens exist only in the game.|Todos os arquivos e fichas existem apenas no jogo.|すべてのファイルとトークンはゲーム内のみのものです。|Todos los archivos y fichas existen solo en el juego.
需要离席，到茶水间配电箱旁按 E；也可以在那里使用维修包。|Leave your desk and press E at the break-room power box, or use a repair kit there.|Saia da mesa e pressione E no quadro elétrico da copa, ou use um kit de reparo ali.|離席して休憩室の配電箱でEを押すか、そこで修理キットを使ってください。|Deja tu mesa y pulsa E junto al cuadro eléctrico, o usa allí un kit de reparación.
此存档使用经典规则。重新入职即可体验扩展工作周。|This save uses classic rules. Start a new run for the expanded workweek.|Este save usa regras clássicas. Comece uma nova partida para a semana expandida.|このセーブは従来ルールです。新規入職で拡張版を遊べます。|Esta partida usa reglas clásicas. Empieza una nueva para jugar la semana ampliada.
加入多人办公室后，可以转接电话、协助调查和支援事故。|Join a multiplayer office to transfer calls, share investigations and help with incidents.|Entre em um escritório multiplayer para transferir ligações e ajudar nos casos e incidentes.|マルチプレイに参加すると転送、調査支援、トラブル対応ができます。|Únete a una oficina multijugador para transferir llamadas y ayudar con casos e incidentes.
转接需要对方线路空闲；对方可以接受或拒绝。协助会共享线索并延长通话耐心。|Transfers need an idle recipient who can accept or decline. Assistance shares clues and adds patience.|A transferência exige uma linha livre e aceitação. A ajuda compartilha pistas e dá mais paciência.|転送先は待機中である必要があり、承諾か拒否を選べます。支援で手がかりと待ち時間を共有します。|La transferencia requiere una línea libre y aceptación. La ayuda comparte pistas y añade paciencia.
角色库已更新，下次来电开始使用。|Character library updated for future calls.|Personagens atualizados para as próximas ligações.|人物一覧を更新しました。次の電話から反映されます。|Personajes actualizados para las próximas llamadas.
创建人物背景和顾虑，或导入最多八位角色的 JSON。角色会参与新来电，自由对话需要 AI 服务。|Create backgrounds and concerns, or import up to eight JSON characters. New calls use them; free dialogue needs AI.|Crie histórias e preocupações ou importe até oito personagens JSON. Novas ligações usam esses personagens; diálogo livre requer IA.|背景や悩みを作成、またはJSONで8人まで読み込めます。新しい電話に登場し、自由対話にはAIが必要です。|Crea trasfondos y preocupaciones o importa hasta ocho personajes JSON. Aparecen en nuevas llamadas; el diálogo libre requiere IA.
在上班前或每日考核后编辑角色库。|Edit characters before work or after the daily review.|Edite personagens antes do turno ou após a avaliação diária.|人物は勤務前または日次評価後に編集できます。|Edita personajes antes del turno o tras la evaluación diaria.
角色文件最大 12 KB|Character files must be 12 KB or smaller.|Arquivos de personagens devem ter até 12 KB.|人物ファイルは12KB以下です。|Los archivos de personajes deben ocupar como máximo 12 KB.
角色格式无效，需要 name、background 和 concern。|Invalid character format: name, background and concern are required.|Formato inválido: name, background e concern são obrigatórios.|形式が無効です。name、background、concernが必要です。|Formato no válido: se requieren name, background y concern.
此浏览器不支持录制，请使用桌面版 Chrome 或 Edge。|Recording is unavailable. Use desktop Chrome or Edge.|Gravação indisponível. Use Chrome ou Edge no computador.|録画非対応です。デスクトップ版ChromeかEdgeを使用してください。|Grabación no disponible. Usa Chrome o Edge de escritorio.
浏览器没有可用的录制编码器。|No supported recording codec is available.|Nenhum codec de gravação compatível está disponível.|対応する録画コーデックがありません。|No hay un códec de grabación compatible.
正在保存录制…|Saving recording…|Salvando gravação…|録画を保存中…|Guardando grabación…
本地录制已满 20 段，请删除旧片段后再录制。|The 20-clip limit is reached. Delete old clips before recording.|Limite de 20 clipes atingido. Exclua clipes antigos antes de gravar.|20件の上限です。古い映像を削除してから録画してください。|Se alcanzó el límite de 20 clips. Elimina clips antiguos antes de grabar.
录制已保存在本机素材库。|Recording saved in this browser's media library.|Gravação salva na biblioteca deste navegador.|このブラウザーの素材庫に保存しました。|Grabación guardada en la biblioteca de este navegador.
录制中断，已尝试保存已有内容。|Recording interrupted. Saving captured content.|Gravação interrompida. Salvando o conteúdo capturado.|録画が中断しました。取得済みの内容を保存します。|Grabación interrumpida. Guardando el contenido capturado.
无法开始录制。|Unable to start recording.|Não foi possível iniciar a gravação.|録画を開始できません。|No se puede iniciar la grabación.
没有录制片段。在 Studio 中开始录制后，真实声音或视频会显示在这里。|No clips yet. Record in Studio to see original audio or video here.|Sem clipes. Grave no Studio para ver áudio ou vídeo original aqui.|録画がありません。Studioで録音・録画するとここに表示されます。|Aún no hay clips. Graba en Studio para ver aquí audio o vídeo original.
屏幕录制时选择游戏标签页，并勾选分享标签页声音。录制最长三分钟，保存在本机，可下载或删除。|Select the game tab and share tab audio. Recordings last up to three minutes, stay on this device, and can be downloaded or deleted.|Selecione a aba do jogo e compartilhe o áudio. Gravações de até três minutos ficam neste dispositivo e podem ser baixadas ou excluídas.|ゲームのタブとタブ音声の共有を選択。最大3分の録画はこの端末に保存され、ダウンロードや削除が可能です。|Selecciona la pestaña del juego y comparte su audio. Las grabaciones duran hasta tres minutos, se guardan aquí y se pueden descargar o eliminar.
暂时没有公开房间。可以创建自己的办公室并公开招募。|No public rooms right now. Create an office and open it to others.|Sem salas públicas agora. Crie um escritório e abra para outras pessoas.|公開ルームはありません。オフィスを作成して仲間を募集できます。|No hay salas públicas ahora. Crea una oficina y ábrela a los demás.
所有人到会议室。把笑声也带过来。|Everyone to the meeting room. Bring your excuses.|Todos para a sala de reunião. Tragam suas desculpas.|全員会議室へ。言い訳も持ってこい。|Todos a la sala de reuniones. Traed vuestras excusas.
今天的数字已经出来了。|Today's numbers are in.|Os números de hoje chegaram.|今日の数字が出たぞ。|Ya están las cifras de hoy.
超额完成。看来咖啡机比我更会管理。|Above target. The coffee machine manages better than I do.|Acima da meta. A cafeteira administra melhor que eu.|目標超過。コーヒーマシンは私より管理が上手いな。|Por encima del objetivo. La cafetera dirige mejor que yo.
你们保住了工作。椅子明天继续出租。|You kept your jobs. Chair rental resumes tomorrow.|Vocês mantiveram o emprego. O aluguel das cadeiras continua amanhã.|雇用は継続だ。椅子の貸出は明日も続く。|Conserváis el empleo. El alquiler de sillas sigue mañana.
业绩没过线。纸箱就在门口，自取。|Below target. Boxes are by the door. Help yourselves.|Abaixo da meta. As caixas estão na porta. Sirvam-se.|目標未達。段ボールは入口だ。各自持っていけ。|Por debajo del objetivo. Las cajas están en la puerta. Servíos.
使用自己的声音或已获授权的单人录音，10–120 秒，最大 8 MB。样本会发送到 ElevenLabs 创建角色音色。|Use your own or an authorized single-speaker recording: 10–120 seconds, up to 8 MB. Samples are sent to ElevenLabs to create a voice.|Use sua voz ou uma gravação autorizada de uma pessoa: 10–120 segundos, até 8 MB. A amostra será enviada à ElevenLabs.|自分または許可を得た1人の声を使用。10〜120秒、最大8MB。音声作成のためElevenLabsへ送信します。|Usa tu voz o una grabación autorizada de una persona: 10–120 segundos, hasta 8 MB. La muestra se envía a ElevenLabs.
网站尚未启用声音克隆服务；仍可创建人物并使用默认声音。|Voice cloning is not configured. You can still create characters with default voices.|Clonagem de voz não configurada. Você ainda pode criar personagens com vozes padrão.|音声クローンは未設定です。標準音声の人物は作成できます。|La clonación no está configurada. Puedes crear personajes con voces predeterminadas.
我拥有此声音的使用授权，并同意上传创建音色。|I have permission to use this voice and agree to upload it for cloning.|Tenho autorização para usar esta voz e concordo em enviá-la para clonagem.|この音声の使用許可があり、クローン作成のための送信に同意します。|Tengo permiso para usar esta voz y acepto subirla para clonarla.
音频最大 8 MB。|Audio must be 8 MB or smaller.|O áudio deve ter até 8 MB.|音声は8MB以下です。|El audio debe ocupar como máximo 8 MB.
声音克隆失败|Voice cloning failed|Falha ao clonar voz|音声クローンに失敗|Error al clonar la voz
音色已创建，添加人物后生效。|Voice created. Add the character to use it.|Voz criada. Adicione o personagem para usá-la.|音声を作成しました。人物を追加すると使用できます。|Voz creada. Añade el personaje para usarla.
试探者识破了你的矛盾，工作站出现模拟病毒。|The baiter spotted a contradiction and triggered a simulated virus.|O provocador percebeu uma contradição e ativou um vírus simulado.|相手に矛盾を見抜かれ、模擬ウイルスが発生しました。|El provocador detectó una contradicción y activó un virus simulado.
`.trim().split('\n').map(line=>line.split('|'));
const dynamic=`
通知属于{0}组，档案尾号为 {1}。排除过期档案。|The notice is for group {0}, record {1}. Exclude expired records.|O aviso é do grupo {0}, registro {1}. Exclua registros vencidos.|通知は{0}組、記録番号は{1}。期限切れを除外してください。|El aviso es del grupo {0}, registro {1}. Excluye los caducados.
{0}组 / {1} / 有效|Group {0} / {1} / Valid|Grupo {0} / {1} / Válido|{0}組／{1}／有効|Grupo {0} / {1} / Válido
{0}组 / {1} / 过期|Group {0} / {1} / Expired|Grupo {0} / {1} / Vencido|{0}組／{1}／期限切れ|Grupo {0} / {1} / Caducado
虚构账本初始 {0} 枚代币，入账 20，撤销 5。填入最终余额。|Fictional ledger: start with {0} tokens, add 20, reverse 5. Enter the balance.|Livro fictício: comece com {0} fichas, some 20 e desconte 5. Informe o saldo.|架空帳簿：初期{0}枚、20枚入金、5枚取消。残高を入力。|Registro ficticio: empieza con {0} fichas, suma 20 y resta 5. Introduce el saldo.
桌面便签：本次文件存放在 Documents/{0}。先检查便签，再打开该目录。|Desktop note: files are in Documents/{0}. Read the note, then open the folder.|Nota: arquivos em Documents/{0}. Leia a nota e abra a pasta.|メモ：ファイルはDocuments/{0}にあります。メモを確認してから開きましょう。|Nota: los archivos están en Documents/{0}. Lee la nota y abre la carpeta.
回收站索引：{0}.txt 是最新版；mission.txt 已过期。|Recycle-bin index: {0}.txt is current; mission.txt is outdated.|Índice da lixeira: {0}.txt é atual; mission.txt está desatualizado.|ごみ箱索引：{0}.txtが最新、mission.txtは古い版です。|Índice de papelera: {0}.txt es actual; mission.txt está obsoleto.
左半张 {0}，右半张 {1}。按左→右拼合。|Left half: {0}. Right half: {1}. Assemble left to right.|Metade esquerda: {0}. Direita: {1}. Monte da esquerda para a direita.|左半分は{0}、右半分は{1}。左から右へ組み合わせます。|Mitad izquierda: {0}. Derecha: {1}. Une de izquierda a derecha.
库存有 {0} 张，已使用 12 张。还有多少张可用？|Stock: {0} vouchers, 12 used. How many remain?|Estoque: {0} vales, 12 usados. Quantos restam?|在庫{0}枚、使用済み12枚。残りは何枚？|Existencias: {0} cupones, 12 usados. ¿Cuántos quedan?
共 {0} 箱，三个站点均分。每站分配多少箱？|Split {0} crates equally among three stations. Crates per station?|Divida {0} caixas entre três estações. Quantas por estação?|{0}箱を3拠点で均等に分配。1拠点あたり何箱？|Reparte {0} cajas entre tres estaciones. ¿Cuántas por estación?
往返 {0} 天，每天 3 包补给，额外备 2 包。总共几包？|A {0}-day round trip needs 3 packs daily plus 2 spares. Total packs?|Viagem de {0} dias, 3 pacotes por dia e 2 extras. Qual o total?|往復{0}日、1日3袋、予備2袋。合計何袋？|Viaje de {0} días, 3 paquetes al día y 2 extras. ¿Total?
Documents/{0}|Documents/{0}|Documents/{0}|Documents/{0}|Documents/{0}
`.trim().split('\n').map(line=>line.split('|'));
const catalogNames=['zh','en','pt','ja','es'];
const keys=new Set(JSON.parse(fs.readFileSync('src/i18n/messages.json','utf8')));
for(const row of [...rows,...longRows,...dynamic]){if(row.length!==5)throw Error('Bad translation row '+row[0]);keys.add(row[0]);}
for(let i=0;i<catalogNames.length;i++){const path=`src/i18n/catalogs/${catalogNames[i]}.json`,catalog=JSON.parse(fs.readFileSync(path,'utf8'));for(const row of [...rows,...longRows,...dynamic])catalog[row[0]]=row[i];fs.writeFileSync(path,JSON.stringify(catalog,null,2)+'\n');}
fs.writeFileSync('src/i18n/messages.json',JSON.stringify([...keys],null,2)+'\n');
