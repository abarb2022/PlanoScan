package com.example.demo.service;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import java.security.Key;
import java.util.Date;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

  @Value("${jwt.secret}")
  private String secret;

  @Value("${jwt.expiration}")
  private long expirationMs;

  private Key getSigningKey() {
    return Keys.hmacShaKeyFor(secret.getBytes());
  }

  public String generateToken(String email, String role) {
    return Jwts.builder()
        .setSubject(email)
        .claim("role", role)
        .setIssuedAt(new Date())
        .setExpiration(new Date(System.currentTimeMillis() + expirationMs))
        .signWith(getSigningKey())
        .compact();
  }

  public String extractEmail(String token) {
    return parseClaims(token).getSubject();
  }

  public String extractRole(String token) {
    return parseClaims(token).get("role", String.class);
  }

  public boolean isTokenValid(String token) {
    try {
      parseClaims(token);
      return true;
    } catch (JwtException e) {
      return false;
    }
  }

  private Claims parseClaims(String token) {
    return Jwts.parserBuilder()
        .setSigningKey(getSigningKey())
        .build()
        .parseClaimsJws(token)
        .getBody();
  }
}
