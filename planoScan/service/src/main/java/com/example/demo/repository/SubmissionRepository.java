package com.example.demo.repository;

import com.example.demo.entity.Submission;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface SubmissionRepository extends JpaRepository<Submission, UUID> {
  boolean existsByRepId(UUID repId);

  @Query(
      "SELECT s FROM Submission s JOIN FETCH s.rep JOIN FETCH s.store st JOIN FETCH st.company"
          + " JOIN FETCH s.planogram p"
          + " WHERE s.status = com.example.demo.entity.Submission.Status.PENDING"
          + " AND s.planogram IS NOT NULL"
          + " AND s.scoringAttempts < :maxAttempts"
          + " ORDER BY s.submittedAt ASC")
  List<Submission> findPendingForScoring(@Param("maxAttempts") int maxAttempts);

  @Query(
      "SELECT s FROM Submission s JOIN FETCH s.rep JOIN FETCH s.store st JOIN FETCH st.company"
          + " JOIN FETCH s.planogram p LEFT JOIN FETCH s.score sc"
          + " WHERE s.flaggedForReview = true"
          + " AND s.status = com.example.demo.entity.Submission.Status.SCORED"
          + " AND (:companyId IS NULL OR st.company.id = :companyId)"
          + " ORDER BY s.submittedAt DESC")
  List<Submission> findFlaggedByCompany(@Param("companyId") UUID companyId);
}

