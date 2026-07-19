package com.example.demo.repository;

import com.example.demo.entity.Product;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductRepository extends JpaRepository<Product, UUID> {
  Page<Product> findByCompanyId(UUID companyId, Pageable pageable);

  boolean existsByNameAndCompanyId(String name, UUID companyId);

  boolean existsByNameAndCompanyIdAndIdNot(String name, UUID companyId, UUID id);

  Optional<Product> findByNameIgnoreCaseAndCompanyId(String name, UUID companyId);

  List<Product> findByCompanyIdAndNameContainingIgnoreCase(UUID companyId, String namePart);

  List<Product> findByCompanyId(UUID companyId);
}
