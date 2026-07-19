package com.example.demo.repository;

import com.example.demo.entity.Planogram;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PlanogramRepository extends JpaRepository<Planogram, UUID> {
  Page<Planogram> findByCompanyId(UUID companyId, Pageable pageable);
}
