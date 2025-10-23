# Implementação de Rascunhos (Draft Status) - Globe Memories

## 📋 Visão Geral

Implementada a funcionalidade de **guardar viagens como rascunho** no frontend React. Agora o viajante pode:

1. ✅ **Guardar como Rascunho** - Salva apenas o nome da viagem (validação mínima)
2. ✅ **Continuar Editando** - Retorna ao rascunho depois para continuar
3. ✅ **Publicar Viagem** - Requer validação completa de todos os campos
4. ✅ **Filtrar Rascunhos** - Opção para mostrar/ocultar rascunhos na listagem
5. ✅ **Indicador Visual** - Badge "📝 Rascunho" nos cartões de viagem

---

## 🔧 Alterações Frontend

### 1. **Novo Campo no Modelo de Viagem**
```javascript
status: 'draft' // valores: 'draft' ou 'published'
```

### 2. **Estados Adicionados**
- `saveAction` - Controla se o utilizador quer guardar como rascunho ou publicar
- `showDrafts` - Toggle para mostrar/ocultar rascunhos

### 3. **Funções Modificadas**
- `validateForm()` - Mantida com validação completa (para publicar)
- `validateFormForDraft()` - **NOVA** - Validação mínima apenas do nome
- `handleAddTravel()` - Agora suporta ambos os cenários (rascunho/publicar)
- `getFilteredTravels()` - Filtra rascunhos quando `showDrafts === false`

### 4. **Funcionalidades UI**
- **Botões de Ação**: "Guardar como Rascunho" e "Publicar Viagem" na última aba do modal
- **Filtro de Rascunhos**: Checkbox "Mostrar rascunhos" nos filtros
- **Opção de Filtro**: Novo item "📝 Rascunhos" no dropdown de filtros
- **Badge Visual**: "📝 Rascunho" nos cartões de viagem que são rascunhos
- **Botão Publicar**: Botão verde "✅ Publicar" nos rascunhos para publicação rápida

---

## 🎯 Backend - O que Precisa Ser Implementado

### 1. **Adicionar Campo `status` ao Modelo Trip**

```java
@Entity
@Table(name = "trips")
public class Trip {
    // ... campos existentes ...
    
    @Column(name = "status", nullable = false)
    @Enumerated(EnumType.STRING)
    private TripStatus status = TripStatus.DRAFT;
    
    // ... resto do código ...
}

public enum TripStatus {
    DRAFT("draft"),
    PUBLISHED("published");
    
    private String value;
    
    TripStatus(String value) {
        this.value = value;
    }
    
    public String getValue() {
        return value;
    }
}
```

### 2. **Atualizar DTOs**

**TripRequestDto:**
```java
@Data
@AllArgsConstructor
@NoArgsConstructor
public class TripRequestDto {
    // ... campos existentes ...
    
    @NotNull(message = "Status é obrigatório")
    private String status; // 'draft' ou 'published'
}
```

**TripResponseDto:**
```java
@Data
@AllArgsConstructor
@NoArgsConstructor
public class TripResponseDto {
    // ... campos existentes ...
    
    private String status; // 'draft' ou 'published'
}
```

### 3. **Atualizar TripController**

```java
@PostMapping
public ResponseEntity<TripResponseDto> createTrip(@Valid @RequestBody TripRequestDto tripRequest) {
    // O status vem do frontend
    Trip trip = tripMapper.toEntity(tripRequest);
    if (trip.getStatus() == null) {
        trip.setStatus(TripStatus.DRAFT);
    }
    
    Trip savedTrip = tripService.saveTrip(trip);
    return ResponseEntity.status(HttpStatus.CREATED).body(tripMapper.toDto(savedTrip));
}

@GetMapping
public ResponseEntity<List<TripResponseDto>> getAllTrips(
    @RequestParam(required = false) String status,
    @RequestParam(required = false) Boolean includeDrafts) {
    
    List<Trip> trips;
    
    if (status != null) {
        // Filtrar por status específico
        trips = tripService.getTripsByStatus(TripStatus.valueOf(status.toUpperCase()));
    } else if (includeDrafts != null && !includeDrafts) {
        // Excluir rascunhos
        trips = tripService.getTripsByStatusNot(TripStatus.DRAFT);
    } else {
        // Retornar todos
        trips = tripService.getAllTrips();
    }
    
    return ResponseEntity.ok(trips.stream().map(tripMapper::toDto).collect(Collectors.toList()));
}

@PutMapping("/{id}")
public ResponseEntity<TripResponseDto> updateTrip(
    @PathVariable Long id,
    @Valid @RequestBody TripRequestDto tripRequest) {
    
    Trip existingTrip = tripService.getTripById(id);
    
    // Se estava em draft e agora quer publicar
    if (existingTrip.getStatus() == TripStatus.DRAFT && 
        tripRequest.getStatus() != null &&
        tripRequest.getStatus().equals("published")) {
        // Validar todos os campos obrigatórios
        validatePublishableTrip(tripRequest);
    }
    
    Trip updatedTrip = tripMapper.toEntity(tripRequest);
    updatedTrip.setId(id);
    Trip savedTrip = tripService.updateTrip(updatedTrip);
    return ResponseEntity.ok(tripMapper.toDto(savedTrip));
}
```

### 4. **Atualizar TripService**

```java
@Service
public class TripService {
    
    @Autowired
    private TripRepository tripRepository;
    
    public Trip saveTrip(Trip trip) {
        if (trip.getStatus() == null) {
            trip.setStatus(TripStatus.DRAFT);
        }
        return tripRepository.save(trip);
    }
    
    public List<Trip> getTripsByStatus(TripStatus status) {
        return tripRepository.findByStatus(status);
    }
    
    public List<Trip> getTripsByStatusNot(TripStatus status) {
        return tripRepository.findByStatusNot(status);
    }
    
    public Trip publishDraft(Long tripId) {
        Trip trip = tripRepository.findById(tripId)
            .orElseThrow(() -> new EntityNotFoundException("Trip not found"));
        
        if (trip.getStatus() != TripStatus.DRAFT) {
            throw new IllegalStateException("Only draft trips can be published");
        }
        
        trip.setStatus(TripStatus.PUBLISHED);
        return tripRepository.save(trip);
    }
    
    // ... outros métodos ...
}
```

### 5. **Atualizar TripRepository**

```java
public interface TripRepository extends JpaRepository<Trip, Long> {
    List<Trip> findByStatus(TripStatus status);
    List<Trip> findByStatusNot(TripStatus status);
    List<Trip> findByUserIdAndStatus(Long userId, TripStatus status);
}
```

### 6. **Endpoint de Publicação Rápida (Opcional)**

```java
@PutMapping("/{id}/publish")
public ResponseEntity<TripResponseDto> publishTrip(@PathVariable Long id) {
    Trip publishedTrip = tripService.publishDraft(id);
    return ResponseEntity.ok(tripMapper.toDto(publishedTrip));
}
```

---

## 📊 Fluxos de Uso

### Fluxo 1: Guardar como Rascunho
```
1. Utilizador clica "Adicionar Viagem"
2. Preenche APENAS o nome da viagem
3. Clica "Guardar como Rascunho"
4. ✅ Viagem guardada com status='draft'
5. Utilizador vê badge "📝 Rascunho" no cartão
```

### Fluxo 2: Continuar Editando Rascunho
```
1. Utilizador vê viagem com "📝 Rascunho"
2. Clica "Editar" ou "Publicar"
3. Modal abre com dados do rascunho
4. Preenche campos adicionais
5. Clica "Guardar como Rascunho" para salvar progresso
   OU
   Clica "Publicar Viagem" para publicar (requer validação completa)
```

### Fluxo 3: Publicar Rascunho
```
1. Utilizador tem rascunho com dados completos
2. Clica "Publicar" (botão verde nos rascunhos)
3. Sistema valida TODOS os campos obrigatórios
4. ✅ Se ok: Altera status para 'published'
   ❌ Se erro: Mostra mensagem com campos faltando
5. Badge "📝 Rascunho" desaparece do cartão
```

---

## 🔍 Validação

### Ao Guardar como Rascunho (Validação Mínima)
- ✅ Nome não vazio
- ✅ Nome >= 3 caracteres
- ✅ Nome <= 100 caracteres

### Ao Publicar (Validação Completa - Já Existente)
- ✅ Todos os campos obrigatórios do `validateForm()`
- ✅ País obrigatório
- ✅ Cidade obrigatória
- ✅ Datas válidas
- ✅ Avaliação de 1-5 estrelas
- ✅ Categorias selecionadas
- ✅ Idiomas selecionados
- ✅ Descrição curta (10-350 caracteres)
- ✅ Descrição longa (20-6000 caracteres)
- ✅ Imagem de destaque obrigatória
- ✅ E todos os outros campos validated

---

## 📱 Sincronização com Backend

### Opção 1: Sincronização Imediata (Recomendada)
```javascript
// No frontend, ao guardar como rascunho:
const draftData = {
    ...newTravel,
    status: 'draft',
    userId: user.id
};

// POST para backend
POST /api/trips
Body: draftData
```

### Opção 2: Armazenamento Local + Sincronização Lazy
```javascript
// Guardar localmente no localStorage
localStorage.setItem('travel_draft_' + id, JSON.stringify(draftTravel));

// Sincronizar com backend quando:
// - Utilizador reconecta online
// - Utilizador clica "Publicar"
// - Periodicamente a cada 30 segundos
```

---

## ✅ Checklist de Implementação Backend

- [ ] Adicionar enum `TripStatus` (DRAFT, PUBLISHED)
- [ ] Adicionar coluna `status` à tabela `trips` (migration)
- [ ] Atualizar entidade `Trip` com campo `status`
- [ ] Atualizar DTOs com campo `status`
- [ ] Atualizar `TripController` (POST, PUT, GET com filtro)
- [ ] Atualizar `TripService` com métodos de status
- [ ] Atualizar `TripRepository` com queries
- [ ] Adicionar endpoint `PUT /trips/{id}/publish` (opcional)
- [ ] Adicionar testes unitários
- [ ] Adicionar testes integração
- [ ] Documentar endpoints Swagger/OpenAPI
- [ ] Testar fluxos de rascunho e publicação

---

## 🚀 Deploy

Após implementação no backend:

1. Executar migrations para adicionar coluna `status`
2. Definir valor padrão para viagens existentes: `status = 'published'`
3. Deploy do código Java/Spring
4. Validar endpoints com Postman/Insomnia
5. Testar fluxos E2E no frontend

---

## 📝 Notas Importantes

- **Viagens antigas**: Devem receber `status = 'published'` na migration
- **Armazenamento**: Rascunhos são guardados no banco de dados (não apenas localStorage)
- **Permissões**: Apenas o proprietário pode editar seu próprio rascunho
- **Eliminação**: Rascunhos devem ser eliminados quando o utilizador elimina (como viagens normais)

