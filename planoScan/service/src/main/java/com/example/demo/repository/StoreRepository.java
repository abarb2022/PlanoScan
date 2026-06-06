package com.example.demo.repository;

import com.example.demo.entity.Store;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Repository
public interface StoreRepository extends JpaRepository<Store, Long> {
    List<Store> findByCompanyId(Long companyId);
    Page<Store> findByCompanyId(Long companyId, Pageable pageable);
    boolean existsByNameAndCompanyId(String name, Long companyId);
    boolean existsByNameAndCompanyIdAndIdNot(String name, Long companyId, Long id);
}
