import React from 'react';

const EditTravel = () => {
  return (
    <div>
      <h1>Editar Viagem</h1>
      <form>
        <input type="text" placeholder="Título da Viagem" />
        <textarea placeholder="Descrição da Viagem"></textarea>
        <input type="number" placeholder="Preço" />
        <input type="number" placeholder="Número de Dias" />
        <button type="submit">Salvar Alterações</button>
      </form>
    </div>
  );
};

export default EditTravel;
