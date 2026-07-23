package com.example.demo.repository;

import com.example.demo.entity.Submission;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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

  @Query(
      value =
          "SELECT s FROM Submission s JOIN FETCH s.rep JOIN FETCH s.store st JOIN FETCH st.company"
              + " LEFT JOIN FETCH s.planogram LEFT JOIN FETCH s.score sc"
              + " WHERE sc IS NOT NULL"
              + " AND (:companyId IS NULL OR st.company.id = :companyId)"
              + " AND (:storeId IS NULL OR st.id = :storeId)"
              + " AND (:repId IS NULL OR s.rep.id = :repId)"
              + " AND (:minScore IS NULL OR sc.overallScore >= :minScore)"
              + " AND (:maxScore IS NULL OR sc.overallScore <= :maxScore)",
      countQuery =
          "SELECT count(s) FROM Submission s JOIN s.store st"
              + " WHERE s.score IS NOT NULL"
              + " AND (:companyId IS NULL OR st.company.id = :companyId)"
              + " AND (:storeId IS NULL OR st.id = :storeId)"
              + " AND (:repId IS NULL OR s.rep.id = :repId)"
              + " AND (:minScore IS NULL OR s.score.overallScore >= :minScore)"
              + " AND (:maxScore IS NULL OR s.score.overallScore <= :maxScore)")
  Page<Submission> findScored(
      @Param("companyId") UUID companyId,
      @Param("storeId") UUID storeId,
      @Param("repId") UUID repId,
      @Param("minScore") Float minScore,
      @Param("maxScore") Float maxScore,
      Pageable pageable);

  @Query(
      "SELECT s FROM Submission s JOIN FETCH s.rep JOIN FETCH s.store st JOIN FETCH st.company"
          + " LEFT JOIN FETCH s.planogram LEFT JOIN FETCH s.score"
          + " WHERE s.id = :id")
  Optional<Submission> findDetailById(@Param("id") UUID id);
}

