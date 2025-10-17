// src/components/UserProfile.js
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const UserProfile = () => {
  const { username } = useParams();
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    // Simulação de dados (substituir por chamada real ao backend)
    const mockData = {
      username: username,
      email: `${username}@example.com`,
      travels: ['Viagem a Lisboa', 'Explorando o Rio'],
    };
    setProfileData(mockData);

    // Exemplo de chamada com axios (comentar até o backend estar pronto)
    // axios.get(`/api/profile/${username}`).then(response => {
    //   setProfileData(response.data);
    // });
  }, [username]);

  return (
    <div>
      <h2>Perfil do Viajante</h2>
      {profileData ? (
        <>
          <p>Username: {profileData.username}</p>
          <p>Email: {profileData.email}</p>
          <p>Viagens: {profileData.travels.join(', ')}</p>
        </>
      ) : (
        <p>Carregando...</p>
      )}
    </div>
  );
};

export default UserProfile;