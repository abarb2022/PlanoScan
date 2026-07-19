package com.example.demo.service;

import com.example.demo.dto.planogram.PlanogramRequestDto;
import com.example.demo.dto.planogram.PlanogramResponseDto;
import com.example.demo.entity.Company;
import com.example.demo.entity.Planogram;
import com.example.demo.entity.PlanogramAssignment;
import com.example.demo.entity.Store;
import com.example.demo.entity.User;
import com.example.demo.exception.ErrorCode;
import com.example.demo.exception.ServerException;
import com.example.demo.repository.PlanogramAssignmentRepository;
import com.example.demo.repository.PlanogramRepository;
import com.example.demo.repository.StoreRepository;
import com.example.demo.repository.UserRepository;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@Service
@RequiredArgsConstructor
public class PlanogramService {

  private final PlanogramRepository planogramRepository;
  private final PlanogramAssignmentRepository assignmentRepository;
  private final StoreRepository storeRepository;
  private final UserRepository userRepository;
  private final PhotoStorage photoStorage;
  private final PlanogramParsingService parsingService;

  @Transactional(readOnly = true)
  public List<PlanogramResponseDto> getPlanograms(int page, int size, String currentUserEmail) {
    User currentUser = getUser(currentUserEmail);
    Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

    Page<Planogram> result =
        currentUser.getRole() == User.Role.ADMIN
            ? planogramRepository.findAll(pageable)
            : planogramRepository.findByCompanyId(currentUser.getCompany().getId(), pageable);

    return result.getContent().stream().map(this::toDto).toList();
  }

  @Transactional
  public PlanogramResponseDto createPlanogram(
      PlanogramRequestDto dto, MultipartFile image, String currentUserEmail) {
    User currentUser = getUser(currentUserEmail);

    Store store =
        storeRepository
            .findById(dto.getStoreId())
            .orElseThrow(() -> new ServerException(ErrorCode.STORE_NOT_FOUND));

    ensureAccess(currentUser, store.getCompany());

    String imageUrl = image != null && !image.isEmpty()
        ? photoStorage.store(image, "planograms")
        : null;

    Planogram planogram =
        Planogram.builder()
            .company(store.getCompany())
            .name(dto.getName())
            .productCategory(dto.getProductCategory())
            .referenceImageUrl(imageUrl)
            .validFrom(dto.getValidFrom())
            .validUntil(dto.getValidUntil())
            .isActive(true)
            .build();

    Planogram saved = planogramRepository.save(planogram);

    PlanogramAssignment link =
        PlanogramAssignment.builder()
            .planogram(saved)
            .store(store)
            .validFrom(dto.getValidFrom())
            .validUntil(dto.getValidUntil())
            .build();
    assignmentRepository.save(link);

    if (imageUrl != null) {
      parsingService.parseAsync(saved.getId(), image);
    }

    return toDto(planogramRepository.findById(saved.getId()).orElse(saved));
  }

  @Transactional
  public void deletePlanogram(UUID id, String currentUserEmail) {
    Planogram planogram =
        planogramRepository
            .findById(id)
            .orElseThrow(() -> new ServerException(ErrorCode.PLANOGRAM_NOT_FOUND));

    User currentUser = getUser(currentUserEmail);
    ensureAccess(currentUser, planogram.getCompany());

    assignmentRepository.deleteByPlanogramId(id);
    planogramRepository.delete(planogram);
  }

  private PlanogramResponseDto toDto(Planogram p) {
    String storeId = null;
    String storeName = null;
    if (p.getAssignments() != null && !p.getAssignments().isEmpty()) {
      var first = p.getAssignments().get(0);
      if (first.getStore() != null) {
        storeId = first.getStore().getId().toString();
        storeName = first.getStore().getName();
      }
    }

    return PlanogramResponseDto.builder()
        .id(p.getId())
        .name(p.getName())
        .productCategory(p.getProductCategory())
        .referenceImageUrl(p.getReferenceImageUrl())
        .parsed(p.getLayoutSpec() != null && !p.getLayoutSpec().isEmpty())
        .layoutSpec(p.getLayoutSpec())
        .storeId(storeId != null ? UUID.fromString(storeId) : null)
        .storeName(storeName)
        .validFrom(p.getValidFrom())
        .validUntil(p.getValidUntil())
        .active(p.isActive())
        .createdAt(p.getCreatedAt())
        .build();
  }

  private User getUser(String email) {
    return userRepository
        .findByEmail(email)
        .orElseThrow(() -> new ServerException(ErrorCode.USER_NOT_FOUND));
  }

  private void ensureAccess(User user, Company company) {
    if (user.getRole() != User.Role.ADMIN
        && !company.getId().equals(user.getCompany().getId())) {
      throw new ServerException(ErrorCode.ACCESS_DENIED);
    }
  }
}
