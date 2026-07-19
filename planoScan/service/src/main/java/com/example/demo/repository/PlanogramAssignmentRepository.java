package com.example.demo.repository;

import com.example.demo.entity.PlanogramAssignment;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface PlanogramAssignmentRepository extends JpaRepository<PlanogramAssignment, UUID> {

  @Query(
      "SELECT pa FROM PlanogramAssignment pa JOIN FETCH pa.planogram p"
          + " WHERE pa.store.id = :storeId"
          + " AND (pa.validFrom IS NULL OR pa.validFrom <= :today)"
          + " AND (pa.validUntil IS NULL OR pa.validUntil >= :today)"
          + " AND p.isActive = true"
          + " ORDER BY pa.id DESC")
  List<PlanogramAssignment> findActiveByStoreId(
      @Param("storeId") UUID storeId, @Param("today") LocalDate today);

  void deleteByPlanogramId(UUID planogramId);
}
