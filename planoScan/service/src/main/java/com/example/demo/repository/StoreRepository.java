package com.example.demo.repository;

import com.example.demo.entity.Store;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Repository
public interface StoreRepository extends JpaRepository<Store, UUID> {
    List<Store> findByCompanyId(UUID companyId);
    Page<Store> findByCompanyId(UUID companyId, Pageable pageable);
    boolean existsByNameAndCompanyId(String name, UUID companyId);
    boolean existsByNameAndCompanyIdAndIdNot(String name, UUID companyId, UUID id);
}
