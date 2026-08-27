# -*- coding: utf-8 -*-
"""Surgical patch: substituir apenas o WRAPPER do modal de criação
(linhas ~3996-4582 e 6567-6622) por uma estrutura v3 premium.
O <form> interno (4584-6565) com as 9 secções fica INTACTO.
"""
import sys

PATH = r'C:\Users\Tiago\Desktop\Globe Memories -  Github\globeMemoriesReact\src\pages\MyTravels.js'

with open(PATH, 'r', encoding='utf-8') as f:
    content = f.read()

# Localizar os marcadores
# 1) Início do modal: a linha "      {isModalOpen && ("
# 2) Antes do form: "            <form onSubmit={(e) => e.preventDefault()}>"
# 3) Depois do form: "            </form>" (linha 6565)
# 4) Fim do modal: "      )}" (linha 6622, fecha o isModalOpen && (...))

start_marker = u'      {isModalOpen && ('
form_start_marker = u'            <form onSubmit={(e) => e.preventDefault()}>'
form_end_marker = u'            </form>'
end_marker = u'      )}\n\n      {/* \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\n          MY TRAVELS v3 \u2014 Listagem'

start_idx = content.find(start_marker)
form_start_idx = content.find(form_start_marker)
form_end_idx = content.find(form_end_marker)
end_idx = content.find(end_marker)

print(f'START: {start_idx}')
print(f'FORM_START: {form_start_idx}')
print(f'FORM_END: {form_end_idx}')
print(f'END: {end_idx}')

if -1 in (start_idx, form_start_idx, form_end_idx, end_idx):
    sys.exit(1)

# Construir o novo wrapper (header + sidebar + tabs + settings + content)
# O conteúdo entre form_start_idx e form_end_idx (que contém as 9 secções) fica INTACTO.
# Substituimos:
#   [start_marker ... form_start_marker]  -> novo HEADER + SIDEBAR + TABS + SETTINGS + abertura do CONTENT
#   [form_end_marker ... end_marker]       -> fecho do CONTENT + FOOTER + end_marker
# O end_marker inclui o ")}" + o comentário do v3 listagem que vem a seguir.

new_top = u'''      {isModalOpen && (
        <div className="gm-modal-v3" role="dialog" aria-modal="true" aria-labelledby="gm-modal-v3__title">
          <div className="gm-modal-v3__panel">

            {/* ── Header ──────────────────────────────────────────────── */}
            <div className="gm-modal-v3__head">
              <div className="gm-modal-v3__head-title">
                <span className="gm-modal-v3__head-icon"><Compass size={20} strokeWidth={1.8} /></span>
                <div className="gm-modal-v3__head-titles">
                  <h2 id="gm-modal-v3__title">
                    {isEditing
                      ? (newTravel.name && newTravel.name.trim() ? newTravel.name : 'Editar Viagem')
                      : (newTravel.name && newTravel.name.trim() ? newTravel.name : 'Nova Viagem')}
                  </h2>
                  <div className="gm-modal-v3__sub">
                    <span>{selectedTravelType.main === 'multi' ? 'Multidestino' : 'Destino único'}</span>
                    {selectedTravelType.isGroup ? <span>\u00b7 Grupo</span> : null}
                    {hasSavedDraft && !isEditing ? (
                      <span className="gm-modal-v3__draft-pill" title="Rascunho guardado automaticamente">Rascunho guardado</span>
                    ) : null}
                  </div>
                </div>
              </div>
              <div className="gm-modal-v3__head-actions">
                <button
                  type="button"
                  className="gm-modal-v3__btn gm-modal-v3__btn--secondary"
                  onClick={() => setIsSettingsModalOpen(true)}
                  title="Configurações da viagem"
                >
                  <Settings size={14} strokeWidth={2} />
                  <span className="gm-modal-v3__btn--label-hide">Configurações</span>
                </button>
                <button
                  type="button"
                  className="gm-modal-v3__btn gm-modal-v3__btn--accent"
                  onClick={() => { setSaveAction('draft'); handleAddTravel(); }}
                  title="Guardar como rascunho para continuar depois"
                >
                  <Bookmark size={14} strokeWidth={2} />
                  <span className="gm-modal-v3__btn--label-hide">Rascunho</span>
                </button>
                <button
                  type="button"
                  className="gm-modal-v3__btn gm-modal-v3__btn--primary"
                  onClick={() => { setSaveAction('publish'); handleAddTravel(); }}
                  title="Publicar viagem (requer todos os campos obrigatórios)"
                >
                  <Check size={14} strokeWidth={2.2} />
                  <span>{isEditing ? 'Guardar' : 'Publicar'}</span>
                </button>
                <button
                  type="button"
                  className="gm-modal-v3__btn gm-modal-v3__btn--danger"
                  onClick={closeModal}
                  title="Fechar modal"
                  aria-label="Fechar"
                >
                  <X size={16} strokeWidth={2.2} />
                </button>
              </div>
            </div>

            {/* ── Sidebar (desktop) — lista de tabs com badges de erro ── */}
            <div className="gm-modal-v3__sidebar" role="tablist" aria-label="Secções do formulário">
              <div className="gm-modal-v3__sidebar-label">Secções</div>
              <button type="button" role="tab" aria-selected={activeTab === 'generalInfo'} className={`gm-modal-v3__tab ${activeTab === 'generalInfo' ? 'is-active' : ''}`} onClick={() => handleTabChange('generalInfo')}>
                <span className="gm-modal-v3__tab-num">1</span>
                <FileText className="gm-modal-v3__tab-icon" size={16} strokeWidth={2} />
                <span className="gm-modal-v3__tab-label">Informações Gerais</span>
                {((errorCountsBySection.general || 0) + (errorCountsBySection.media || 0)) > 0 ? (
                  <span className="gm-modal-v3__tab-badge">{((errorCountsBySection.general || 0) + (errorCountsBySection.media || 0))}</span>
                ) : null}
              </button>
              <button type="button" role="tab" aria-selected={activeTab === 'prices'} className={`gm-modal-v3__tab ${activeTab === 'prices' ? 'is-active' : ''}`} onClick={() => handleTabChange('prices')}>
                <span className="gm-modal-v3__tab-num">2</span>
                <Wallet className="gm-modal-v3__tab-icon" size={16} strokeWidth={2} />
                <span className="gm-modal-v3__tab-label">Preços da Viagem</span>
              </button>
              <button type="button" role="tab" aria-selected={activeTab === 'accommodation'} className={`gm-modal-v3__tab ${activeTab === 'accommodation' ? 'is-active' : ''}`} onClick={() => handleTabChange('accommodation')}>
                <span className="gm-modal-v3__tab-num">3</span>
                <BedDouble className="gm-modal-v3__tab-icon" size={16} strokeWidth={2} />
                <span className="gm-modal-v3__tab-label">Estadia</span>
                {(errorCountsBySection.accommodations || 0) > 0 ? (
                  <span className="gm-modal-v3__tab-badge">{errorCountsBySection.accommodations}</span>
                ) : null}
              </button>
              <button type="button" role="tab" aria-selected={activeTab === 'food'} className={`gm-modal-v3__tab ${activeTab === 'food' ? 'is-active' : ''}`} onClick={() => handleTabChange('food')}>
                <span className="gm-modal-v3__tab-num">4</span>
                <UtensilsCrossed className="gm-modal-v3__tab-icon" size={16} strokeWidth={2} />
                <span className="gm-modal-v3__tab-label">Alimentação</span>
                {(errorCountsBySection.foods || 0) > 0 ? (
                  <span className="gm-modal-v3__tab-badge">{errorCountsBySection.foods}</span>
                ) : null}
              </button>
              <button type="button" role="tab" aria-selected={activeTab === 'transport'} className={`gm-modal-v3__tab ${activeTab === 'transport' ? 'is-active' : ''}`} onClick={() => handleTabChange('transport')}>
                <span className="gm-modal-v3__tab-num">5</span>
                <Bus className="gm-modal-v3__tab-icon" size={16} strokeWidth={2} />
                <span className="gm-modal-v3__tab-label">Transportes</span>
              </button>
              <button type="button" role="tab" aria-selected={activeTab === 'pointsOfInterest'} className={`gm-modal-v3__tab ${activeTab === 'pointsOfInterest' ? 'is-active' : ''}`} onClick={() => handleTabChange('pointsOfInterest')}>
                <span className="gm-modal-v3__tab-num">6</span>
                <MapPin className="gm-modal-v3__tab-icon" size={16} strokeWidth={2} />
                <span className="gm-modal-v3__tab-label">Pontos de Referência</span>
                {(errorCountsBySection.referencePoints || 0) > 0 ? (
                  <span className="gm-modal-v3__tab-badge">{errorCountsBySection.referencePoints}</span>
                ) : null}
              </button>
              <button type="button" role="tab" aria-selected={activeTab === 'itinerary'} className={`gm-modal-v3__tab ${activeTab === 'itinerary' ? 'is-active' : ''}`} onClick={() => handleTabChange('itinerary')}>
                <span className="gm-modal-v3__tab-num">7</span>
                <CalendarRange className="gm-modal-v3__tab-icon" size={16} strokeWidth={2} />
                <span className="gm-modal-v3__tab-label">Itinerário da Viagem</span>
                {(errorCountsBySection.itinerary || 0) > 0 ? (
                  <span className="gm-modal-v3__tab-badge">{errorCountsBySection.itinerary}</span>
                ) : null}
              </button>
              <button type="button" role="tab" aria-selected={activeTab === 'negativePoints'} className={`gm-modal-v3__tab ${activeTab === 'negativePoints' ? 'is-active' : ''}`} onClick={() => handleTabChange('negativePoints')}>
                <span className="gm-modal-v3__tab-num">8</span>
                <AlertTriangle className="gm-modal-v3__tab-icon" size={16} strokeWidth={2} />
                <span className="gm-modal-v3__tab-label">Pontos Negativos</span>
                {(errorCountsBySection.negativePoints || 0) > 0 ? (
                  <span className="gm-modal-v3__tab-badge">{errorCountsBySection.negativePoints}</span>
                ) : null}
              </button>
              {selectedTravelType.isGroup ? (
                <button type="button" role="tab" aria-selected={activeTab === 'group'} className={`gm-modal-v3__tab ${activeTab === 'group' ? 'is-active' : ''}`} onClick={() => handleTabChange('group')}>
                  <span className="gm-modal-v3__tab-num">9</span>
                  <Users className="gm-modal-v3__tab-icon" size={16} strokeWidth={2} />
                  <span className="gm-modal-v3__tab-label">Viagem em Grupo</span>
                </button>
              ) : null}
            </div>

            {/* ── Mobile tabs strip ────────────────────────────────────── */}
            <div className="gm-modal-v3__tabs-mobile" role="tablist" aria-label="Secções do formulário">
              {[
                ['generalInfo', 1, 'Info'],
                ['prices', 2, 'Preços'],
                ['accommodation', 3, 'Estadia'],
                ['food', 4, 'Comida'],
                ['transport', 5, 'Transporte'],
                ['pointsOfInterest', 6, 'Pontos'],
                ['itinerary', 7, 'Itinerário'],
                ['negativePoints', 8, 'Negativos'],
                selectedTravelType.isGroup ? ['group', 9, 'Grupo'] : null,
              ].filter(Boolean).map(([key, num, label]) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === key}
                  className={`gm-modal-v3__tab-mobile ${activeTab === key ? 'is-active' : ''}`}
                  onClick={() => handleTabChange(key)}
                >
                  <span className="gm-modal-v3__tab-num">{num}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>

            {/* ── Mobile inline settings (privacy, travel type, group) ── */}
            <div className="gm-modal-v3__settings-mobile">
              <div className="gm-modal-v3__settings-row">
                <div className="gm-modal-v3__field">
                  <label htmlFor="gm-modal-v3__privacy">Privacidade</label>
                  <select id="gm-modal-v3__privacy" name="privacy" value={newTravel.privacy} onChange={handleChange}>
                    <option value="public">Pública</option>
                    <option value="followers">Seguidores</option>
                    <option value="private">Privada</option>
                  </select>
                </div>
                <div className="gm-modal-v3__field">
                  <label htmlFor="gm-modal-v3__ttype">Tipo de Viagem</label>
                  <select id="gm-modal-v3__ttype" value={selectedTravelType.main} onChange={(e) => setSelectedTravelType((p) => ({ ...p, main: e.target.value }))}>
                    <option value="single">Destino único</option>
                    <option value="multi">Multidestino</option>
                  </select>
                </div>
              </div>
              <label className="gm-modal-v3__toggle-row">
                <span>Viagem em grupo</span>
                <input
                  type="checkbox"
                  className="gm-modal-v3__toggle"
                  checked={selectedTravelType.isGroup}
                  onChange={(e) => setSelectedTravelType((p) => ({ ...p, isGroup: e.target.checked }))}
                />
              </label>
            </div>

            {/* ── Content — wraps the form INTACTO ──────────────────────── */}
            <div className="gm-modal-v3__content">
              <div className="gm-modal-v3__content-inner">
'''

new_bottom = u'''
              </div>
            </div>

            {/* ── Footer — navegação + progress bar ────────────────────── */}
            <div className="gm-modal-v3__foot">
              <div className="gm-modal-v3__foot-progress" aria-hidden="true">
                <span>Secção {(() => {
                  const order = ['generalInfo','prices','accommodation','food','transport','pointsOfInterest','itinerary','negativePoints','group'];
                  const i = order.indexOf(activeTab);
                  return i === -1 ? 1 : i + 1;
                })()} de {(() => {
                  const base = 8;
                  return selectedTravelType.isGroup ? base + 1 : base;
                })()}</span>
                <div className="gm-modal-v3__foot-progress-bar">
                  <div
                    className="gm-modal-v3__foot-progress-fill"
                    style={{ width: (() => {
                      const order = ['generalInfo','prices','accommodation','food','transport','pointsOfInterest','itinerary','negativePoints','group'];
                      const total = selectedTravelType.isGroup ? 9 : 8;
                      const i = order.indexOf(activeTab);
                      const step = i === -1 ? 1 : i + 1;
                      return Math.round((step / total) * 100) + '%';
                    })() }}
                  />
                </div>
              </div>
              <div className="gm-modal-v3__foot-actions">
                {activeTab === 'group' || activeTab === 'negativePoints' ? (
                  <>
                    <button
                      type="button"
                      className="gm-modal-v3__btn gm-modal-v3__btn--secondary"
                      onClick={handlePrevTab}
                    >
                      <ChevronLeft size={14} strokeWidth={2.2} />
                      <span>Anterior</span>
                    </button>
                    <button
                      type="button"
                      className="gm-modal-v3__btn gm-modal-v3__btn--accent"
                      onClick={() => { setSaveAction('draft'); handleAddTravel(); }}
                      title="Guardar como rascunho para continuar depois"
                    >
                      <Bookmark size={14} strokeWidth={2} />
                      <span>Rascunho</span>
                    </button>
                    <button
                      type="button"
                      className="gm-modal-v3__btn gm-modal-v3__btn--primary"
                      onClick={() => { setSaveAction('publish'); handleAddTravel(); }}
                      title="Publicar viagem (requer todos os campos obrigatórios)"
                    >
                      <Check size={14} strokeWidth={2.2} />
                      <span>{isEditing ? 'Guardar & Publicar' : 'Publicar Viagem'}</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="gm-modal-v3__btn gm-modal-v3__btn--secondary"
                      onClick={handlePrevTab}
                      disabled={(() => {
                        const order = ['generalInfo','prices','accommodation','food','transport','pointsOfInterest','itinerary','negativePoints','group'];
                        return order.indexOf(activeTab) <= 0;
                      })()}
                    >
                      <ChevronLeft size={14} strokeWidth={2.2} />
                      <span>Anterior</span>
                    </button>
                    <button
                      type="button"
                      className="gm-modal-v3__btn gm-modal-v3__btn--primary"
                      onClick={handleNextTab}
                      disabled={(() => {
                        const order = ['generalInfo','prices','accommodation','food','transport','pointsOfInterest','itinerary','negativePoints','group'];
                        const i = order.indexOf(activeTab);
                        const total = selectedTravelType.isGroup ? 9 : 8;
                        return i >= total - 1;
                      })()}
                    >
                      <span>Avançar</span>
                      <ChevronRight size={14} strokeWidth={2.2} />
                    </button>
                  </>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

'''

# === Build the new content ===
# Replace [start_idx .. form_start_idx] with new_top + form_start_marker
# Replace [form_end_idx .. end_idx] with form_end_marker + new_bottom
# Note: new_top ENDS just before the <form>, and new_bottom STARTS just after </form>

# The form is wrapped in <form ...>...</form>; the existing CSS classes inside
# the form (`.LeftPosition`, `.action-buttons`, etc.) are still rendered; we
# don't touch them — only the wrapper around.

# Compute the slice: from start_marker to form_start_marker (exclusive)
# The text between them is the legacy wrapper (header + sidebar + tabs).
slice1_start = start_idx
slice1_end = form_start_idx  # form_start_marker starts at this index

# The text between form_end_marker and end_marker is the legacy footer
slice2_start = form_end_idx + len(form_end_marker)  # after </form>
slice2_end = end_idx

# New file content
new_content = (
    content[:slice1_start]
    + new_top
    + content[slice1_start:slice1_end]  # ... this is just the {isModalOpen && ( line
    + content[slice1_end:slice2_start]  # ... the form body intact
    + new_bottom
    + content[slice2_end:]
)

# Wait: the above is wrong. Let me redo:
# I want to keep {isModalOpen && ( at the start. The new_top ENDS with the
# opening of <div className="gm-modal-v3__content-inner"> followed by the
# form open tag. So:
#   content[:start_idx] + new_top + form_open + content[form_open_end:form_close_start] + form_close + new_bottom + content[after_end_marker:]

# The form body is content[form_start_idx + len(form_start_marker) : form_end_idx].
# form_start_marker = "            <form onSubmit={(e) => e.preventDefault()}>\n"
# Actually we want to keep both markers. So:

form_open_str = content[form_start_idx:form_start_idx + len(form_start_marker)]
form_close_str = content[form_end_idx:form_end_idx + len(form_end_marker)]
form_body = content[form_start_idx + len(form_start_marker):form_end_idx]

# After the </form>, content goes to slice2_end (= end_idx, the ")}" + comment)
after_form_old = content[form_end_idx + len(form_end_marker):slice2_end]

# Build final
new_content = (
    content[:slice1_start]
    + new_top
    + form_open_str
    + form_body
    + form_close_str
    + new_bottom
    + content[slice2_end:]
)

with open(PATH, 'w', encoding='utf-8') as f:
    f.write(new_content)

with open(PATH, 'r', encoding='utf-8') as f:
    new_lines = sum(1 for _ in f)
print(f'NEW LINE COUNT: {new_lines}')
