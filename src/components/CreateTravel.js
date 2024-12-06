import React from 'react';

const CreateTravel = () => {
  return (
    <div>
      <h1>Criar Viagem</h1>
      <form>
        <input type="text" placeholder="Título da Viagem" />
        <textarea placeholder="Descrição da Viagem"></textarea>
        <input type="number" placeholder="Preço" />
        <input type="number" placeholder="Número de Dias" />
        <button type="submit">Criar Viagem</button>
      </form>
    </div>
  );
};

export default CreateTravel;
