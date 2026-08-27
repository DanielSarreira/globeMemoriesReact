# -*- coding: utf-8 -*-
"""Surgical patch for /my-travels v3 chrome (frontend only)."""
import sys

PATH = r'C:\Users\Tiago\Desktop\Globe Memories -  Github\globeMemoriesReact\src\pages\MyTravels.js'

with open(PATH, 'r', encoding='utf-8') as f:
    content = f.read()

# Find the legacy chrome block (start marker -> end marker is the </div> that closes travels-grid)
start_marker = u'      {/* Filtros e estat\u00edsticas */}'
# Use the next "{/* Toast Component */}" as the boundary to keep the toast intact below.
end_marker = u'      {/* Toast Component */}'

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)
print(f'START: {start_idx}  END: {end_idx}')
if start_idx == -1 or end_idx == -1:
    sys.exit(1)

new_block = u'''      {/* \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
          MY TRAVELS v3 \u2014 Listagem
          O landing v3 (acima) continua a aparecer quando n\u00e3o h\u00e1 viagens.
          Esta sec\u00e7\u00e3o mostra: header + stats + filtros (chips) + grid de
          cards premium. Mant\u00e9m TODAS as a\u00e7\u00f5es originais: criar, editar,
          apagar, publicar rascunho, ver detalhes, abrir o filtro de
          tipo/privacidade. O editor (modal) renderiza por cima disto
          como full-screen, intacto. */}
      {(() => {
        const visible = (showDrafts ? travels : travels.filter((t) => t.status !== 'draft'));
        const count = (cond) => visible.filter(cond).length;
        const single = count((t) => !t.travelType?.main || t.travelType?.main === 'single');
        const multi  = count((t) => t.travelType?.main === 'multi' || t.multiDestinations);
        const group  = count((t) => t.travelType?.isGroup || t.groupData);
        const drafts = travels.filter((t) => t.status === 'draft').length;
        const filtered = getFilteredTravels();

        return (
          <div className="gm-mt">
            <div className="gm-mt__head">
              <div className="gm-mt__head-info">
                <h1 className="gm-mt__head-title">
                  <span className="gm-mt__head-title-icon"><Compass size={22} strokeWidth={1.8} /></span>
                  <span>As minhas viagens</span>
                </h1>
                <p className="gm-mt__head-sub">
                  {visible.length === 0
                    ? 'Ainda n\u00e3o tem viagens. Crie a primeira para come\u00e7ar a construir o seu di\u00e1rio de bordo.'
                    : `Tem ${visible.length} ${visible.length === 1 ? 'viagem' : 'viagens'} ${drafts > 0 ? `(+ ${drafts} ${drafts === 1 ? 'rascunho' : 'rascunhos'})` : ''} na sua conta.`}
                </p>
              </div>
              <div className="gm-mt__head-actions">
                <button
                  type="button"
                  className="gm-profile__btn gm-profile__btn--primary"
                  onClick={openModal}
                >
                  <Plus size={16} strokeWidth={2.2} />
                  <span>Nova viagem</span>
                </button>
              </div>
            </div>

            <div className="gm-mt__stats">
              <div className="gm-mt-stat">
                <div className="gm-mt-stat__row">
                  <span className="gm-mt-stat__label">Destino \u00fanico</span>
                  <span className="gm-mt-stat__icon gm-mt-stat__icon--brand"><MapPin size={14} strokeWidth={2} /></span>
                </div>
                <span className="gm-mt-stat__num">{single}</span>
              </div>
              <div className="gm-mt-stat">
                <div className="gm-mt-stat__row">
                  <span className="gm-mt-stat__label">Multidestino</span>
                  <span className="gm-mt-stat__icon gm-mt-stat__icon--accent"><Globe size={14} strokeWidth={2} /></span>
                </div>
                <span className="gm-mt-stat__num">{multi}</span>
              </div>
              <div className="gm-mt-stat">
                <div className="gm-mt-stat__row">
                  <span className="gm-mt-stat__label">Em grupo</span>
                  <span className="gm-mt-stat__icon gm-mt-stat__icon--success"><Users size={14} strokeWidth={2} /></span>
                </div>
                <span className="gm-mt-stat__num">{group}</span>
              </div>
              <div className="gm-mt-stat">
                <div className="gm-mt-stat__row">
                  <span className="gm-mt-stat__label">Rascunhos</span>
                  <span className="gm-mt-stat__icon gm-mt-stat__icon--muted"><Filter size={14} strokeWidth={2} /></span>
                </div>
                <span className="gm-mt-stat__num">{drafts}</span>
              </div>
            </div>

            <div className="gm-mt__filters" role="tablist" aria-label="Filtros de viagens">
              {[
                ['all', 'Todas', visible.length, null],
                ['single', 'Destino \u00fanico', single, <MapPin key="i" size={13} strokeWidth={2} />],
                ['multi', 'Multidestino', multi, <Globe key="i" size={13} strokeWidth={2} />],
                ['group', 'Em grupo', group, <Users key="i" size={13} strokeWidth={2} />],
                ['public', 'P\u00fablicas', visible.filter((t) => !t.privacy || t.privacy === 'public').length, <Globe key="i" size={13} strokeWidth={2} />],
                ['followers', 'Seguidores', visible.filter((t) => t.privacy === 'followers').length, <Users key="i" size={13} strokeWidth={2} />],
                ['private', 'Privadas', visible.filter((t) => t.privacy === 'private').length, <Lock key="i" size={13} strokeWidth={2} />],
                ['draft', 'Rascunhos', drafts, <Filter key="i" size={13} strokeWidth={2} />],
              ].map(([key, label, c, icon]) => (
                <button
                  key={key}
                  type="button"
                  className={`gm-mt-chip ${filterType === key ? 'is-active' : ''}`}
                  onClick={() => setFilterType(key)}
                  role="tab"
                  aria-selected={filterType === key}
                >
                  {icon}
                  <span>{label}</span>
                  <span className="gm-mt-chip__count">{c}</span>
                </button>
              ))}
              <span className="gm-mt__filters-spacer" />
              <label className="gm-mt__drafts-toggle" title="Incluir rascunhos na listagem">
                <input
                  type="checkbox"
                  checked={showDrafts}
                  onChange={(e) => setShowDrafts(e.target.checked)}
                />
                <span>Mostrar rascunhos</span>
              </label>
            </div>

            {loadingUserTrips && visible.length === 0 ? (
              <div className="gm-mt__skeleton-grid" aria-hidden="true">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="gm-mt-skel">
                    <div className="gm-mt-skel__media" />
                    <div className="gm-mt-skel__line gm-mt-skel__line--long" />
                    <div className="gm-mt-skel__line gm-mt-skel__line--short" />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="gm-mt-empty">
                <span className="gm-mt-empty__icon">
                  {filterType === 'all' ? <Compass size={28} strokeWidth={1.6} /> : <Search size={28} strokeWidth={1.6} />}
                </span>
                <h3 className="gm-mt-empty__title">
                  {filterType === 'all' ? 'Ainda sem viagens por aqui' : 'Nenhuma viagem corresponde ao filtro'}
                </h3>
                <p className="gm-mt-empty__text">
                  {filterType === 'all'
                    ? 'Crie a sua primeira viagem e partilhe as suas mem\u00f3rias com a comunidade Globe Memories.'
                    : 'Experimente outro filtro ou veja todas as viagens que j\u00e1 publicou.'}
                </p>
                {filterType === 'all' ? (
                  <button
                    type="button"
                    className="gm-profile__btn gm-profile__btn--primary gm-mt-empty__cta"
                    onClick={openModal}
                  >
                    <Plus size={16} strokeWidth={2.2} />
                    <span>Criar primeira viagem</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="gm-profile__btn gm-profile__btn--primary gm-mt-empty__cta"
                    onClick={() => setFilterType('all')}
                  >
                    Ver todas as viagens
                  </button>
                )}
              </div>
            ) : (
              <div className="gm-mt__grid">
                {filtered.map((travel) => {
                  const isMulti = travel.travelType?.main === 'multi' || travel.multiDestinations;
                  const isGroup = travel.travelType?.isGroup || travel.groupData;
                  const isDraft = travel.status === 'draft';
                  const privacy = travel.privacy || 'public';
                  const where = isMulti && travel.multiDestinations
                    ? `${travel.multiDestinations[0]?.city || ''}, ${travel.multiDestinations[0]?.country || ''}${travel.multiDestinations.length > 1 ? ` +${travel.multiDestinations.length - 1}` : ''}`
                    : `${travel.city || ''}, ${travel.countryName || travel.country || ''}`;
                  const rating = travel.tripRating || travel.stars || 0;
                  const days = travel.tripDurationDays || travel.days;
                  const cost = travel.cost?.total ?? travel.price;
                  const cats = (travel.category || []).slice(0, 3);
                  const highlightSrc = travel.highlightImage
                    ? (travel.highlightImage instanceof File ? URL.createObjectURL(travel.highlightImage) : travel.highlightImage)
                    : null;
                  return (
                    <article key={travel.id} className={`gm-mt-card ${isDraft ? 'is-draft' : ''}`}>
                      <div className="gm-mt-card__media">
                        {highlightSrc ? (
                          <img
                            src={highlightSrc}
                            alt={travel.name}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const fb = e.currentTarget.nextElementSibling;
                              if (fb) fb.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div
                          className="gm-mt-card__media-fallback"
                          style={highlightSrc ? { display: 'none' } : undefined}
                        >
                          <ImageIcon size={28} strokeWidth={1.5} />
                          <span>Sem imagem</span>
                        </div>
                        <div className="gm-mt-card__tags">
                          {isDraft && <span className="gm-mt-tag gm-mt-tag--draft">Rascunho</span>}
                          <span className={`gm-mt-tag ${isMulti ? 'gm-mt-tag--multi' : 'gm-mt-tag--public'}`}>
                            {isMulti ? 'Multidestino' : 'Destino \u00fanico'}
                          </span>
                          {isGroup && <span className="gm-mt-tag gm-mt-tag--group">Grupo</span>}
                          <span className={`gm-mt-tag gm-mt-tag--${privacy}`}>
                            {privacy === 'private' ? 'Privada' : privacy === 'followers' ? 'Seguidores' : 'P\u00fablica'}
                          </span>
                        </div>
                      </div>

                      <div className="gm-mt-card__body">
                        <h3 className="gm-mt-card__title" title={travel.name}>{travel.name}</h3>
                        <span className="gm-mt-card__where">
                          <MapPin size={13} strokeWidth={2} />
                          <span className="gm-mt-card__where-text">{where || 'Destino a definir'}</span>
                        </span>

                        <div className="gm-mt-card__meta">
                          {days ? (
                            <span className="gm-mt-card__meta-item">
                              <Clock size={12} strokeWidth={2} /> {days} {days === 1 ? 'dia' : 'dias'}
                            </span>
                          ) : null}
                          {cost ? (
                            <span className="gm-mt-card__meta-item">
                              <Wallet size={12} strokeWidth={2} /> {cost}\u20ac
                            </span>
                          ) : null}
                          {rating > 0 ? (
                            <span className="gm-mt-card__rating">
                              <Star size={12} strokeWidth={2} fill="currentColor" /> {rating.toFixed(1)}
                            </span>
                          ) : null}
                        </div>

                        {cats.length > 0 ? (
                          <div className="gm-mt-card__cats">
                            {cats.map((c) => (
                              <span key={c} className="gm-mt-card__cat">{c}</span>
                            ))}
                          </div>
                        ) : null}
                      </div>

                      <div className="gm-mt-card__foot">
                        <Link to={`/travel/${travel.id}`} className="gm-mt-card__foot-btn gm-mt-card__foot-btn--view">
                          <Eye size={13} strokeWidth={2} /> Ver
                        </Link>
                        {isDraft ? (
                          <button
                            type="button"
                            className="gm-mt-card__foot-btn gm-mt-card__foot-btn--publish"
                            onClick={() => {
                              handleEdit(travel.id);
                              setActiveTab('generalInfo');
                              setIsModalOpen(true);
                            }}
                            title="Continuar a editar e publicar rascunho"
                          >
                            <Check size={13} strokeWidth={2.2} /> Publicar
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className="gm-mt-card__foot-btn gm-mt-card__foot-btn--edit"
                          onClick={() => (isDraft ? handleEdit(travel.id) : handleLoadBackendTrip(travel.id))}
                          title="Editar viagem"
                        >
                          <Pencil size={13} strokeWidth={2} /> Editar
                        </button>
                        <button
                          type="button"
                          className="gm-mt-card__foot-btn gm-mt-card__foot-btn--delete"
                          onClick={() => (isDraft ? handleDelete(travel.id) : handleDeleteBackendTrip(travel.id))}
                          title="Eliminar viagem"
                        >
                          <Trash2 size={13} strokeWidth={2} />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

'''

# Replace [start_idx, end_idx) with new_block
new_content = content[:start_idx] + new_block + content[end_idx:]

with open(PATH, 'w', encoding='utf-8') as f:
    f.write(new_content)

# Count lines
with open(PATH, 'r', encoding='utf-8') as f:
    new_lines = sum(1 for _ in f)
print(f'NEW LINE COUNT: {new_lines}')
