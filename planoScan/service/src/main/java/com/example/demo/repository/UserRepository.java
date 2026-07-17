package com.example.demo.repository;

import com.example.demo.entity.User;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, UUID> {
  Optional<User> findByEmail(String email);

  boolean existsByCompanyId(UUID companyId);

  Page<User> findByRole(User.Role role, Pageable pageable);

  Page<User> findByCompanyIdAndRole(UUID companyId, User.Role role, Pageable pageable);
}
