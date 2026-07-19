package com.example.demo.service;

import com.example.demo.dto.product.ProductPageResponseDto;
import com.example.demo.dto.product.ProductRequestDto;
import com.example.demo.dto.product.ProductResponseDto;
import com.example.demo.entity.Company;
import com.example.demo.entity.Product;
import com.example.demo.entity.User;
import com.example.demo.exception.ErrorCode;
import com.example.demo.exception.ServerException;
import com.example.demo.repository.CompanyRepository;
import com.example.demo.repository.ProductRepository;
import com.example.demo.repository.UserRepository;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class ProductService {

  private final ProductRepository productRepository;
  private final UserRepository userRepository;
  private final CompanyRepository companyRepository;
  private final PhotoStorage photoStorage;

  @Transactional(readOnly = true)
  public ProductPageResponseDto getProducts(int page, int size, UUID companyId, String currentUserEmail) {
    User currentUser = getUser(currentUserEmail);
    UUID effectiveCompanyId = resolveCompanyId(currentUser, companyId);

    Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
    Page<Product> result =
        effectiveCompanyId != null
            ? productRepository.findByCompanyId(effectiveCompanyId, pageable)
            : productRepository.findAll(pageable);

    return new ProductPageResponseDto(
        result.getContent().stream().map(this::toDto).toList(),
        result.getTotalPages(),
        result.getTotalElements(),
        result.getNumber());
  }

  @Transactional
  public ProductResponseDto createProduct(
      ProductRequestDto dto, MultipartFile referenceImage, String currentUserEmail) {
    User currentUser = getUser(currentUserEmail);
    Company company = resolveCompany(currentUser, dto.getCompanyId());

    if (productRepository.existsByNameAndCompanyId(dto.getName(), company.getId())) {
      throw new ServerException(ErrorCode.PRODUCT_ALREADY_EXISTS);
    }

    String imageUrl = referenceImage != null && !referenceImage.isEmpty()
        ? photoStorage.store(referenceImage, "products")
        : null;

    Product product =
        Product.builder()
            .name(dto.getName())
            .sku(dto.getSku())
            .description(dto.getDescription())
            .referenceImageUrl(imageUrl)
            .company(company)
            .build();

    return toDto(productRepository.save(product));
  }

  @Transactional
  public ProductResponseDto updateProduct(
      UUID id, ProductRequestDto dto, MultipartFile referenceImage, String currentUserEmail) {
    Product product = productRepository.findById(id)
        .orElseThrow(() -> new ServerException(ErrorCode.PRODUCT_NOT_FOUND));

    User currentUser = getUser(currentUserEmail);
    ensureAccess(currentUser, product.getCompany().getId());

    if (productRepository.existsByNameAndCompanyIdAndIdNot(dto.getName(), product.getCompany().getId(), id)) {
      throw new ServerException(ErrorCode.PRODUCT_ALREADY_EXISTS);
    }

    product.setName(dto.getName());
    product.setSku(dto.getSku());
    product.setDescription(dto.getDescription());

    if (referenceImage != null && !referenceImage.isEmpty()) {
      product.setReferenceImageUrl(photoStorage.store(referenceImage, "products"));
    }

    return toDto(productRepository.save(product));
  }

  @Transactional
  public void deleteProduct(UUID id, String currentUserEmail) {
    Product product = productRepository.findById(id)
        .orElseThrow(() -> new ServerException(ErrorCode.PRODUCT_NOT_FOUND));

    User currentUser = getUser(currentUserEmail);
    ensureAccess(currentUser, product.getCompany().getId());

    productRepository.delete(product);
  }

  private User getUser(String email) {
    return userRepository.findByEmail(email)
        .orElseThrow(() -> new ServerException(ErrorCode.USER_NOT_FOUND));
  }

  private UUID resolveCompanyId(User user, UUID requested) {
    if (user.getRole() == User.Role.ADMIN) return requested;
    return user.getCompany().getId();
  }

  private Company resolveCompany(User user, UUID requestedCompanyId) {
    if (user.getRole() == User.Role.ADMIN && requestedCompanyId != null) {
      return companyRepository.findById(requestedCompanyId)
          .orElseThrow(() -> new ServerException(ErrorCode.COMPANY_NOT_FOUND));
    }
    Company company = user.getCompany();
    if (company == null) throw new ServerException(ErrorCode.COMPANY_NOT_FOUND);
    return company;
  }

  private void ensureAccess(User user, UUID productCompanyId) {
    if (user.getRole() != User.Role.ADMIN
        && !productCompanyId.equals(user.getCompany().getId())) {
      throw new ServerException(ErrorCode.ACCESS_DENIED);
    }
  }

  private ProductResponseDto toDto(Product p) {
    return ProductResponseDto.builder()
        .id(p.getId())
        .name(p.getName())
        .sku(p.getSku())
        .description(p.getDescription())
        .referenceImageUrl(p.getReferenceImageUrl())
        .companyId(p.getCompany().getId())
        .companyName(p.getCompany().getName())
        .createdAt(p.getCreatedAt())
        .build();
  }
}
