# 🔗 **GUIA DE INTEGRAÇÃO - FRONTEND REACT + BACKEND JAVA SPRING**

**Data:** 23 Outubro 2025  
**Versão:** 1.0  
**Para:** Equipa Backend Java  
**Objetivo:** Integração perfeita do React com Spring Boot  

---

## 📋 **ÍNDICE**

1. [Preparação](#preparação)
2. [Setup Backend](#setup-backend)
3. [Configuração CORS](#configuração-cors)
4. [Autenticação JWT](#autenticação-jwt)
5. [API Endpoints](#api-endpoints)
6. [Fluxos Principais](#fluxos-principais)
7. [Tratamento de Erros](#tratamento-de-erros)
8. [Deploy](#deploy)

---

## 🔧 **PREPARAÇÃO**

### **Pré-requisitos Frontend**

O frontend já está pronto:
- ✅ React 19 com React Router v6
- ✅ Axios configurado com interceptadores
- ✅ Context API para autenticação
- ✅ Error handling implementado
- ✅ Validação de formulários
- ✅ Sanitização XSS

### **Dependências Backend Necessárias**

```xml
<!-- pom.xml -->
<dependencies>
    <!-- Spring Boot Core -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>

    <!-- Spring Security + JWT -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-security</artifactId>
    </dependency>
    
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-api</artifactId>
        <version>0.12.3</version>
    </dependency>
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-impl</artifactId>
        <version>0.12.3</version>
        <scope>runtime</scope>
    </dependency>
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-jackson</artifactId>
        <version>0.12.3</version>
        <scope>runtime</scope>
    </dependency>

    <!-- Database -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
    
    <dependency>
        <groupId>com.mysql</groupId>
        <artifactId>mysql-connector-java</artifactId>
        <version>8.0.33</version>
    </dependency>

    <!-- Validation -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-validation</artifactId>
    </dependency>

    <!-- Lombok (opcional) -->
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
        <optional>true</optional>
    </dependency>

    <!-- File Upload -->
    <dependency>
        <groupId>commons-io</groupId>
        <artifactId>commons-io</artifactId>
        <version>2.13.0</version>
    </dependency>
</dependencies>
```

---

## 🚀 **SETUP BACKEND**

### **1. Configuração do Projeto Spring Boot**

```java
// Application.java
@SpringBootApplication
public class GlobeMemoriesApplication {
    public static void main(String[] args) {
        SpringApplication.run(GlobeMemoriesApplication.class, args);
    }
}
```

### **2. Configuração application.properties**

```properties
# Server
server.port=8080
server.servlet.context-path=/api

# Database
spring.datasource.url=jdbc:mysql://localhost:3306/globe_memories
spring.datasource.username=root
spring.datasource.password=password
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

# JPA/Hibernate
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQL8Dialect
spring.jpa.properties.hibernate.format_sql=true

# JWT
jwt.secret.key=your-super-secret-key-min-256-bits-long-for-HS256
jwt.expiration=86400000
jwt.refresh.expiration=604800000

# Logging
logging.level.root=INFO
logging.level.com.globememories=DEBUG

# File Upload
spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=10MB
upload.path=/uploads
```

### **3. Estrutura de Diretórios Backend**

```
src/main/java/com/globememories/
├── GlobeMemoriesApplication.java
├── config/
│   ├── CorsConfig.java
│   ├── SecurityConfig.java
│   └── JwtConfig.java
├── controller/
│   ├── AuthController.java
│   ├── UserController.java
│   ├── TravelController.java
│   ├── CommentController.java
│   ├── AdminController.java
│   └── FileUploadController.java
├── service/
│   ├── AuthService.java
│   ├── UserService.java
│   ├── TravelService.java
│   ├── CommentService.java
│   ├── FileUploadService.java
│   └── JwtTokenProvider.java
├── repository/
│   ├── UserRepository.java
│   ├── TravelRepository.java
│   ├── CommentRepository.java
│   └── ReportRepository.java
├── model/
│   ├── User.java
│   ├── Travel.java
│   ├── Comment.java
│   ├── Report.java
│   └── dto/
│       ├── UserDto.java
│       ├── TravelDto.java
│       ├── CommentDto.java
│       └── AuthResponse.java
├── security/
│   ├── JwtAuthenticationFilter.java
│   ├── JwtAuthenticationEntryPoint.java
│   └── CustomUserDetailsService.java
└── exception/
    ├── ResourceNotFoundException.java
    ├── UnauthorizedException.java
    └── GlobalExceptionHandler.java
```

---

## 🔐 **CONFIGURAÇÃO CORS**

### **CorsConfig.java**

```java
package com.globememories.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOriginPatterns(
                    "http://localhost:3000",
                    "http://localhost:8080",
                    "http://127.0.0.1:3000",
                    "https://globememories.com"  // Production
                )
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);

        // Para arquivos estáticos (imagens, etc)
        registry.addMapping("/uploads/**")
                .allowedOriginPatterns("*")
                .allowedMethods("GET", "OPTIONS")
                .maxAge(3600);
    }
}
```

### **SecurityConfig.java**

```java
package com.globememories.config;

import com.globememories.security.JwtAuthenticationFilter;
import com.globememories.security.JwtAuthenticationEntryPoint;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;

    @Autowired
    private UserDetailsService userDetailsService;

    @Bean
    public JwtAuthenticationFilter jwtAuthenticationFilter() {
        return new JwtAuthenticationFilter();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(HttpSecurity http) throws Exception {
        return http.getSharedObject(AuthenticationManagerBuilder.class)
                .userDetailsService(userDetailsService)
                .passwordEncoder(passwordEncoder())
                .and()
                .build();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf()
                .disable()
                .exceptionHandling()
                .authenticationEntryPoint(jwtAuthenticationEntryPoint)
                .and()
                .sessionManagement()
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                .and()
                .authorizeRequests()
                // Public endpoints
                .antMatchers(HttpMethod.POST, "/api/auth/**").permitAll()
                .antMatchers(HttpMethod.GET, "/api/travels").permitAll()
                .antMatchers(HttpMethod.GET, "/api/travels/{id}").permitAll()
                .antMatchers(HttpMethod.GET, "/api/users/{id}").permitAll()
                // Admin endpoints
                .antMatchers("/api/admin/**").hasRole("ADMIN")
                // Protected endpoints
                .antMatchers("/api/**").authenticated()
                .and()
                .addFilterBefore(jwtAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
```

---

## 🔑 **AUTENTICAÇÃO JWT**

### **JwtTokenProvider.java**

```java
package com.globememories.service;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import java.security.Key;
import java.util.Date;

@Component
public class JwtTokenProvider {

    @Value("${jwt.secret.key}")
    private String jwtSecret;

    @Value("${jwt.expiration}")
    private long jwtExpirationMs;

    @Value("${jwt.refresh.expiration}")
    private long refreshTokenExpirationMs;

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes());
    }

    public String generateToken(String userId, String username, String role) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationMs);

        return Jwts.builder()
                .setSubject(userId)
                .claim("username", username)
                .claim("role", role)
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(getSigningKey(), SignatureAlgorithm.HS512)
                .compact();
    }

    public String generateRefreshToken(String userId) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + refreshTokenExpirationMs);

        return Jwts.builder()
                .setSubject(userId)
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(getSigningKey(), SignatureAlgorithm.HS512)
                .compact();
    }

    public String getUserIdFromJWT(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();

        return claims.getSubject();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token);
            return true;
        } catch (MalformedJwtException | ExpiredJwtException | 
                 UnsupportedJwtException | IllegalArgumentException ex) {
            return false;
        }
    }

    public long getExpirationTimeFromToken(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();

        return claims.getExpiration().getTime() - System.currentTimeMillis();
    }
}
```

### **JwtAuthenticationFilter.java**

```java
package com.globememories.security;

import com.globememories.service.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;
import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {
        try {
            String jwt = getJwtFromRequest(request);

            if (StringUtils.hasText(jwt) && tokenProvider.validateToken(jwt)) {
                String userId = tokenProvider.getUserIdFromJWT(jwt);
                UserDetails userDetails = userDetailsService.loadUserByUsername(userId);

                UsernamePasswordAuthenticationToken authentication = 
                        new UsernamePasswordAuthenticationToken(
                            userDetails, null, userDetails.getAuthorities());
                
                authentication.setDetails(
                        new WebAuthenticationDetailsSource().buildDetails(request));
                
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        } catch (Exception ex) {
            // Log exception silently
        }

        filterChain.doFilter(request, response);
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
```

---

## 📡 **API ENDPOINTS**

### **1. AUTENTICAÇÃO**

#### **POST /api/auth/login**
```javascript
// Request
{
  "username": "tiago",
  "password": "password123"
}

// Response (200 OK)
{
  "success": true,
  "message": "Login realizado com sucesso",
  "data": {
    "token": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "user": {
      "id": "123",
      "username": "tiago",
      "email": "tiago@email.com",
      "name": "Tiago Silva",
      "avatar": "https://...",
      "role": "USER"
    },
    "expiresIn": 86400
  }
}

// Error (401 Unauthorized)
{
  "success": false,
  "message": "Credenciais inválidas",
  "error": "INVALID_CREDENTIALS"
}
```

#### **POST /api/auth/register**
```javascript
// Request
{
  "username": "joao",
  "email": "joao@email.com",
  "password": "Password123!",
  "name": "João Silva"
}

// Response (201 Created)
{
  "success": true,
  "message": "Utilizador registado com sucesso",
  "data": {
    "id": "124",
    "username": "joao",
    "email": "joao@email.com",
    "name": "João Silva"
  }
}
```

#### **POST /api/auth/refresh-token**
```javascript
// Request
{
  "refreshToken": "eyJhbGc..."
}

// Response (200 OK)
{
  "success": true,
  "data": {
    "token": "eyJhbGc...",
    "expiresIn": 86400
  }
}
```

#### **POST /api/auth/logout**
```javascript
// Request
Header: Authorization: Bearer <token>

// Response (200 OK)
{
  "success": true,
  "message": "Logout realizado com sucesso"
}
```

#### **POST /api/auth/forgot-password**
```javascript
// Request
{
  "email": "tiago@email.com"
}

// Response (200 OK)
{
  "success": true,
  "message": "Email de reset enviado"
}
```

#### **POST /api/auth/reset-password/:token**
```javascript
// Request
{
  "newPassword": "NewPassword123!"
}

// Response (200 OK)
{
  "success": true,
  "message": "Palavra-passe alterada com sucesso"
}
```

### **2. VIAGENS**

#### **GET /api/travels**
```javascript
// Query params
?page=0&size=10&sort=date&country=Portugal&category=adventure

// Response (200 OK)
{
  "success": true,
  "data": {
    "travels": [
      {
        "id": "1",
        "title": "Viagem a Lisboa",
        "description": "Uma incrível viagem pela capital",
        "images": ["https://...", "https://..."],
        "country": "Portugal",
        "city": "Lisboa",
        "startDate": "2025-01-15",
        "endDate": "2025-01-20",
        "budget": 1500,
        "category": "cultural",
        "transportMethod": "flight",
        "likes": 45,
        "commentsCount": 12,
        "author": {
          "id": "123",
          "username": "tiago",
          "avatar": "https://..."
        },
        "createdAt": "2025-01-10T10:00:00Z"
      }
    ],
    "totalElements": 100,
    "totalPages": 10,
    "currentPage": 0
  }
}
```

#### **GET /api/travels/feed**
```javascript
// Personalized feed for authenticated user
// Same response structure as GET /api/travels
```

#### **GET /api/travels/:id**
```javascript
// Response (200 OK)
{
  "success": true,
  "data": {
    "id": "1",
    "title": "Viagem a Lisboa",
    "description": "Uma incrível viagem pela capital",
    "images": ["https://...", "https://..."],
    "country": "Portugal",
    "city": "Lisboa",
    "startDate": "2025-01-15",
    "endDate": "2025-01-20",
    "budget": 1500,
    "category": "cultural",
    "transportMethod": "flight",
    "author": {
      "id": "123",
      "username": "tiago",
      "name": "Tiago Silva",
      "avatar": "https://..."
    },
    "likes": 45,
    "isLikedByUser": false,
    "comments": [
      {
        "id": "c1",
        "content": "Que viagem incrível!",
        "author": {
          "id": "124",
          "username": "joao",
          "avatar": "https://..."
        },
        "likes": 5,
        "replies": [
          {
            "id": "r1",
            "content": "Obrigado!",
            "author": {
              "id": "123",
              "username": "tiago"
            },
            "likes": 1
          }
        ],
        "createdAt": "2025-01-10T10:00:00Z"
      }
    ],
    "createdAt": "2025-01-10T10:00:00Z"
  }
}
```

#### **POST /api/travels**
```javascript
// Request (with Authorization header)
{
  "title": "Viagem a Paris",
  "description": "Uma viagem romântica",
  "country": "France",
  "city": "Paris",
  "startDate": "2025-06-01",
  "endDate": "2025-06-10",
  "budget": 3000,
  "category": "romance",
  "transportMethod": "flight"
}

// Response (201 Created)
{
  "success": true,
  "message": "Viagem criada com sucesso",
  "data": {
    "id": "new-id",
    "title": "Viagem a Paris",
    ...
  }
}
```

#### **PUT /api/travels/:id**
```javascript
// Same request/response as POST
// Must be author or admin
```

#### **DELETE /api/travels/:id**
```javascript
// Response (204 No Content)
```

#### **POST /api/travels/:id/like**
```javascript
// Response (200 OK)
{
  "success": true,
  "data": {
    "liked": true,
    "likeCount": 46
  }
}
```

#### **DELETE /api/travels/:id/like**
```javascript
// Response (200 OK)
{
  "success": true,
  "data": {
    "liked": false,
    "likeCount": 45
  }
}
```

### **3. COMENTÁRIOS**

#### **POST /api/travels/:id/comments**
```javascript
// Request
{
  "content": "Que viagem incrível!"
}

// Response (201 Created)
{
  "success": true,
  "data": {
    "id": "c1",
    "content": "Que viagem incrível!",
    "author": {
      "id": "123",
      "username": "tiago",
      "avatar": "https://..."
    },
    "likes": 0,
    "createdAt": "2025-01-10T10:00:00Z"
  }
}
```

#### **POST /api/comments/:commentId/replies**
```javascript
// Request
{
  "content": "Obrigado!"
}

// Response (201 Created)
```

#### **POST /api/comments/:commentId/like**
```javascript
// Response (200 OK)
{
  "success": true,
  "data": {
    "liked": true,
    "likeCount": 6
  }
}
```

#### **PUT /api/comments/:commentId**
```javascript
// Request
{
  "content": "Comentário atualizado"
}

// Response (200 OK)
```

#### **DELETE /api/comments/:commentId**
```javascript
// Response (204 No Content)
```

### **4. UTILIZADORES**

#### **GET /api/users/:id**
```javascript
// Response (200 OK)
{
  "success": true,
  "data": {
    "id": "123",
    "username": "tiago",
    "name": "Tiago Silva",
    "email": "tiago@email.com",
    "avatar": "https://...",
    "bio": "Amante de viagens",
    "nationality": "Portugal",
    "joinDate": "2025-01-01",
    "travelCount": 5,
    "followersCount": 120,
    "followingCount": 45,
    "isFollowedByUser": false,
    "isBlockedByUser": false
  }
}
```

#### **PUT /api/users/:id**
```javascript
// Request
{
  "name": "Tiago Silva",
  "bio": "Novo bio",
  "nationality": "Portugal"
}

// Response (200 OK)
```

#### **POST /api/users/:id/avatar**
```javascript
// Form data
FormData.append('file', avatarFile);

// Response (200 OK)
{
  "success": true,
  "data": {
    "avatarUrl": "https://..."
  }
}
```

#### **POST /api/users/:id/follow**
```javascript
// Response (200 OK)
{
  "success": true,
  "data": {
    "followed": true,
    "followersCount": 121
  }
}
```

#### **POST /api/users/:id/unfollow**
```javascript
// Response (200 OK)
{
  "success": true,
  "data": {
    "followed": false,
    "followersCount": 120
  }
}
```

#### **POST /api/users/:id/block**
```javascript
// Response (200 OK)
{
  "success": true,
  "message": "Utilizador bloqueado"
}
```

#### **POST /api/users/:id/unblock**
```javascript
// Response (200 OK)
{
  "success": true,
  "message": "Utilizador desbloqueado"
}
```

### **5. ADMIN**

#### **POST /api/admin/login**
```javascript
// Request
{
  "email": "admin@globememories.com",
  "password": "adminPassword"
}

// Response (200 OK)
{
  "success": true,
  "data": {
    "token": "eyJhbGc...",
    "user": {
      "id": "1",
      "email": "admin@globememories.com",
      "role": "ADMIN"
    }
  }
}
```

#### **GET /api/admin/statistics**
```javascript
// Response (200 OK)
{
  "success": true,
  "data": {
    "totalUsers": 1500,
    "usersLast24h": 45,
    "usersLast7Days": 200,
    "usersLast30Days": 800,
    "totalTravels": 5000,
    "activeUsers": 1200,
    "bannedUsers": 30
  }
}
```

#### **GET /api/admin/reports**
```javascript
// Response (200 OK)
{
  "success": true,
  "data": {
    "reports": [
      {
        "id": "r1",
        "type": "travel",
        "targetId": "travel-123",
        "reason": "inappropriate",
        "description": "Conteúdo inapropriado",
        "reportedBy": {
          "id": "user-456",
          "username": "reporter"
        },
        "status": "pending",
        "createdAt": "2025-01-10T10:00:00Z"
      }
    ]
  }
}
```

#### **PUT /api/admin/reports/:id/status**
```javascript
// Request
{
  "status": "resolved", // pending, reviewing, resolved, rejected
  "action": "delete" // delete, warn, nothing
}

// Response (200 OK)
```

#### **PUT /api/admin/users/:id/ban**
```javascript
// Request
{
  "reason": "Violação de termos"
}

// Response (200 OK)
```

---

## 🔄 **FLUXOS PRINCIPAIS**

### **1. FLUXO DE LOGIN**

```
Frontend                          Backend
   |                                |
   |--POST /api/auth/login--------->|
   |  (username, password)           |
   |                                |
   |<--200 + JWT Token + Refresh-----|
   |                                |
   | (Store token in localStorage)   |
   |                                |
   |--GET /api/travels-------------->|
   |  Authorization: Bearer <token>  |
   |                                |
   |<--200 + Data--------------------|
```

### **2. FLUXO DE TOKEN REFRESH**

```
Frontend                          Backend
   |                                |
   | (Token expirado)               |
   |                                |
   |--POST /api/auth/refresh------->|
   |  (refreshToken)                |
   |                                |
   |<--200 + New Token + New Refresh-|
   |                                |
   | (Update localStorage)          |
   |                                |
   | (Retry original request)       |
```

### **3. FLUXO DE CRIAR VIAGEM**

```
Frontend                          Backend
   |                                |
   | Validation (Frontend)          |
   |                                |
   |--POST /api/travels------------>|
   |  Authorization: Bearer <token> |
   |  {title, desc, images, ...}    |
   |                                |
   |<--201 + Travel Created---------|
   |                                |
   | (Redirect to travel detail)    |
```

### **4. FLUXO DE COMENTÁRIOS**

```
Frontend                          Backend
   |                                |
   |--POST /api/travels/:id/comments|
   |  {content}                     |
   |                                |
   |<--201 + Comment Created--------|
   |                                |
   | (Add to UI without refresh)    |
   |                                |
   |--POST /comments/:id/replies--->|
   |  {content}                     |
   |                                |
   |<--201 + Reply Created----------|
```

---

## ⚠️ **TRATAMENTO DE ERROS**

### **Error Response Format**

```javascript
// 400 Bad Request
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Email é obrigatório",
  "details": [
    {
      "field": "email",
      "message": "Email é obrigatório"
    }
  ]
}

// 401 Unauthorized
{
  "success": false,
  "error": "UNAUTHORIZED",
  "message": "Token inválido ou expirado"
}

// 403 Forbidden
{
  "success": false,
  "error": "FORBIDDEN",
  "message": "Não tem permissão para realizar esta ação"
}

// 404 Not Found
{
  "success": false,
  "error": "NOT_FOUND",
  "message": "Viagem não encontrada"
}

// 500 Internal Server Error
{
  "success": false,
  "error": "INTERNAL_ERROR",
  "message": "Erro no servidor. Tente mais tarde."
}
```

### **Frontend Error Handling**

O frontend já tem implementado:
- ✅ Interceptação automática de 401 (redirects para login)
- ✅ Toast de erro para cada resposta
- ✅ Retry logic com circuit breaker
- ✅ Validação de formulários
- ✅ Error boundaries para crashes

---

## 🌐 **CONFIGURAÇÃO DE AMBIENTE**

### **Desenvolvimento**

**Backend - application.properties**
```properties
server.port=8080
spring.datasource.url=jdbc:mysql://localhost:3306/globe_memories
spring.jpa.hibernate.ddl-auto=create-drop
logging.level.com.globememories=DEBUG
cors.allowed-origins=http://localhost:3000
```

**Frontend - .env**
```env
REACT_APP_API_URL=http://localhost:8080
REACT_APP_API_TIMEOUT=10000
REACT_APP_ENV=development
```

### **Produção**

**Backend - application-prod.properties**
```properties
server.port=8080
server.ssl.key-store=classpath:keystore.p12
server.ssl.key-store-type=PKCS12
spring.datasource.url=jdbc:mysql://prod-db.example.com:3306/globe_memories
spring.jpa.hibernate.ddl-auto=validate
logging.level.com.globememories=INFO
cors.allowed-origins=https://globememories.com
```

**Frontend - .env.production**
```env
REACT_APP_API_URL=https://api.globememories.com
REACT_APP_API_TIMEOUT=10000
REACT_APP_ENV=production
```

---

## 📦 **DEPLOY**

### **Backend Docker**

```dockerfile
FROM openjdk:17-slim

WORKDIR /app

COPY target/globe-memories-1.0.0.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-Dspring.profiles.active=prod", "-jar", "app.jar"]
```

### **docker-compose.yml**

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: globe_memories
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql

  backend:
    build: .
    ports:
      - "8080:8080"
    environment:
      SPRING_DATASOURCE_URL: jdbc:mysql://mysql:3306/globe_memories
      SPRING_DATASOURCE_USERNAME: root
      SPRING_DATASOURCE_PASSWORD: root
    depends_on:
      - mysql

  frontend:
    build: ../globeMemoriesReact
    ports:
      - "3000:3000"
    environment:
      REACT_APP_API_URL: http://backend:8080
    depends_on:
      - backend

volumes:
  mysql_data:
```

---

## 🧪 **TESTES DE INTEGRAÇÃO**

### **Teste 1: Login Flow**

```bash
# 1. Register user
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "TestPass123!",
    "name": "Test User"
  }'

# 2. Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "TestPass123!"
  }'

# 3. Use token
curl -X GET http://localhost:8080/api/travels \
  -H "Authorization: Bearer <token_from_login>"
```

### **Teste 2: Travel CRUD**

```bash
# Create
curl -X POST http://localhost:8080/api/travels \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Travel",
    "description": "A test travel",
    "country": "Portugal",
    "city": "Lisbon"
  }'

# Read
curl -X GET http://localhost:8080/api/travels/1 \
  -H "Authorization: Bearer <token>"

# Update
curl -X PUT http://localhost:8080/api/travels/1 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated Travel"}'

# Delete
curl -X DELETE http://localhost:8080/api/travels/1 \
  -H "Authorization: Bearer <token>"
```

---

## 📋 **CHECKLIST DE INTEGRAÇÃO**

- [ ] CORS configurado e testado
- [ ] JWT implementado e validado
- [ ] Database criada e migrada
- [ ] Autenticação (login/register) funcional
- [ ] Endpoints de viagens completos
- [ ] Upload de imagens configurado
- [ ] Comentários e replies funcionando
- [ ] Admin panel com endpoints
- [ ] Error handling robusto
- [ ] HTTPS/SSL configurado
- [ ] Rate limiting implementado
- [ ] Logging configurado
- [ ] Testes de integração passando
- [ ] Documentação da API atualizada
- [ ] Deploy para staging testado
- [ ] Performance otimizada
- [ ] Backup strategy implementada
- [ ] Monitoring e alertas configurados

---

## 📞 **CONTATO E SUPORTE**

**Frontend Issues:** Verificar `src/axios_helper.js` e contextos  
**Backend Integration:** Revisar endpoints em `ANALISE_COMPLETA_FRONTEND_2025.md`  
**General Questions:** Consultar este guia ou documentação original  

---

## 🎯 **PRÓXIMOS PASSOS**

1. **Semana 1:** Implementar endpoints core (auth, travels)
2. **Semana 2:** Upload de imagens e comentários
3. **Semana 3:** Admin panel completo
4. **Semana 4:** Testes e otimização
5. **Semana 5:** Deploy staging

---

**Preparado por:** GitHub Copilot  
**Data:** 23 Outubro 2025  
**Para:** Equipa Backend Java Spring  

✅ **Pronto para começar? LET'S BUILD!** 🚀
