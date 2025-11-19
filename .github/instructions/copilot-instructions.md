## General Java Development Practices
- Always follow SOLID, DRY, KISS, and YAGNI principles.
- Adhere to OWASP security best practices.
- Break tasks into the smallest units and solve step by step.
- **IMPORTANT**: Copilot is NOT allowed to create unit tests. Test creation must be done by the developer manually.
- **IMPORTANT**: Do NOT create unused methods, classes, or components. Only implement what is actually needed and used in the codebase.
- **IMPORTANT**: Before adding any method or functionality, verify that it will be actively used. Remove any unused code during implementation.
- **CRITICAL**: DO NOT write documentation for code. If documentation is needed, the developer will write it manually. Focus only on implementing functional code without adding comments, JavaDoc, or other documentation.

## Spring Boot Project Structure
- Use Java Spring Boot 3 (Maven, Java 17, Spring Web, Spring Data JPA, Lombok, PostgreSQL driver).
- RestControllers handle all request/response logic.
- ServiceImpl classes handle all database operation logic using Repository methods.
- RestControllers must not autowire Repositories directly unless absolutely necessary.
- ServiceImpl classes must not query the database directly (use Repositories).
- Use DTOs for data transfer between RestControllers and ServiceImpl classes.
- Entity classes are only for carrying data from database queries.

## Entity Class Conventions
- Annotate with @Entity and @Data (Lombok).
- Use @Id and @GeneratedValue(strategy=GenerationType.IDENTITY) for IDs.
- Use FetchType.LAZY for relationships.
- **IMPORTANT**: Copilot is NOT allowed to create new Entity files. Entity creation must be done by the developer manually. Copilot can only add, remove, or modify fields in existing Entity files.
- **CRITICAL**: Before modifying any Entity class to add or change relationships (@OneToMany, @ManyToOne, @ManyToMany, @OneToOne) or inheritance (@Inheritance, extends), ALWAYS ask the user to confirm:
  - The relationship type and cardinality
  - The owning side and inverse side of the relationship
  - Whether cascade operations are needed and which types (PERSIST, MERGE, REMOVE, etc.)
  - The fetch strategy (LAZY or EAGER)
  - Whether the relationship is bidirectional or unidirectional
  - For inheritance: the inheritance strategy (SINGLE_TABLE, JOINED, TABLE_PER_CLASS)
  - For inheritance: which class is the base class and which are subclasses
- **CRITICAL**: Before adding or modifying field constraints in Entity classes, ALWAYS ask the user to confirm:
  - @Column constraints: nullable, unique, length, precision, scale
  - @NotNull, @NotBlank, @NotEmpty validation constraints
  - @UniqueConstraint at table level
  - @Size, @Min, @Max, @Pattern and other validation constraints
  - Default values and columnDefinition
  - Whether the field should be updatable or insertable
- **CRITICAL**: Never assume relationship details or constraint specifications. Always get explicit confirmation from the user before adding relationship annotations, inheritance structures, or field constraints.

## Repository Class Conventions
- Annotate with @Repository.
- Use interfaces extending JpaRepository<Entity, ID> and JpaSpecificationExecutor<Entity>.
- **IMPORTANT**: Choose between Specifications and QueryDSL based on query complexity:
  - **Use Specifications for**: Simple queries on the entity itself or queries that don't require reusable join logic
  - **Use QueryDSL for**: Complex queries requiring reusable join patterns or when join logic needs to be shared across multiple queries
- For Specification-based queries: Create separate Specification classes with static methods for each search criterion
- For QueryDSL queries: Extend QuerydslPredicateExecutor<Entity> and create reusable join methods in custom repository implementations
- Only use JPQL @Query for simple, single-purpose queries that don't involve complex filtering or reusable logic.
- Use @EntityGraph(attributePaths={...}) to avoid N+1 problems in relationship queries.
- Use DTOs for multi-join queries with @Query only when Specifications and QueryDSL are not suitable.

## Service Class Conventions
- Service classes are interfaces; implementations are ServiceImpl classes annotated with @Service.
- **IMPORTANT**: Use constructor injection for dependencies. DO NOT use @Autowired annotation.
- All dependencies must be injected through constructor with final fields.
- Use Lombok @RequiredArgsConstructor for constructor generation when all fields are final.
- ServiceImpl methods return DTOs (not entities) unless necessary.
- Use repository methods with .orElseThrow for existence checks.
- Use @Transactional or transactionTemplate for multiple sequential DB operations.
- **IMPORTANT**: When throwing exceptions, always use error codes from ExceptionCode.java rather than hardcoded messages.
- For example, use `throw new BadRequestException(ExceptionCode.INACTIVE_USER)` instead of `throw new BadRequestException("User is inactive")`.
- **IMPORTANT**: Always combine list and search operations into a single service method that accepts search criteria.
- Create unified search/list methods where empty criteria returns all records (paginated).

## RestController Conventions
- Annotate with @RestController and specify class-level @RequestMapping.
- Use best-practice HTTP method annotations (e.g., @PostMapping, @GetMapping).
- **IMPORTANT**: Use constructor injection for dependencies. DO NOT use @Autowired annotation.
- All dependencies must be injected through constructor with final fields.
- Use Lombok @RequiredArgsConstructor for constructor generation when all fields are final.
- Methods return ResponseEntity<ApiResponse>.
- **IMPORTANT**: Always throw custom exceptions with error codes from ExceptionCode.java rather than hardcoded messages.
- **IMPORTANT**: Always combine list and filter APIs into a single endpoint. The list operation is the default case of filtering with no criteria provided.
- Use search/filter criteria DTOs with all fields optional to support both listing (no filters) and filtering (with criteria).

### API Path Conventions
Follow RESTful API design principles with these 5 standard criteria:

1. **Use Plural Nouns for Resources**: Always use plural nouns for resource endpoints
   - ✅ `/api/users`, `/api/orders`, `/api/students`
   - ❌ `/api/user`, `/api/order`, `/api/student`

2. **Use Hierarchical Structure for Relationships**: Represent resource relationships through path hierarchy
   - ✅ `/api/users/{userId}/orders`, `/api/classes/{classId}/students`
   - ❌ `/api/userOrders`, `/api/classStudents`

3. **Use Kebab-Case for Multi-Word Resources**: Separate words with hyphens for readability
   - ✅ `/api/purchase-orders`, `/api/user-profiles`, `/api/school-years`
   - ❌ `/api/purchaseOrders`, `/api/user_profiles`, `/api/schoolyears`

4. **Use HTTP Methods, Not Verbs in Paths**: Let HTTP methods define the action, not the URL
   - ✅ `GET /api/users/{id}`, `POST /api/users`, `PUT /api/users/{id}`, `DELETE /api/users/{id}`
   - ❌ `/api/getUser/{id}`, `/api/createUser`, `/api/updateUser/{id}`, `/api/deleteUser/{id}`

5. **Use Query Parameters for Filtering, Sorting, and Pagination**: Keep paths clean, use query params for operations
   - ✅ `GET /api/users?status=active&sort=name&page=0&size=20`
   - ❌ `GET /api/users/active/sorted-by-name/page-0-size-20`

**Example Controller Structure**:
```java
@RestController
@RequestMapping("/api/users")
public class UserController {
    // GET /api/users?name=John&status=ACTIVE&page=0&size=20
    @GetMapping
    public ResponseEntity<ApiResponse> searchUsers(
        @ModelAttribute UserSearchCriteria criteria,
        @ParameterObject Pageable pageable
    ) { ... }
    
    // GET /api/users/{id}
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse> getUserById(@PathVariable Long id) { ... }
    
    // POST /api/users
    @PostMapping
    public ResponseEntity<ApiResponse> createUser(@RequestBody UserCreateRequest request) { ... }
    
    // PUT /api/users/{id}
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse> updateUser(
        @PathVariable Long id,
        @RequestBody UserUpdateRequest request
    ) { ... }
    
    // DELETE /api/users/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> deleteUser(@PathVariable Long id) { ... }
    
    // GET /api/users/{userId}/orders
    @GetMapping("/{userId}/orders")
    public ResponseEntity<ApiResponse> getUserOrders(@PathVariable Long userId) { ... }
}
```

### Request and Response DTO Conventions
- **MANDATORY**: Create separate Request DTO and Response DTO for each API endpoint.
- Use Java records for DTOs unless otherwise specified.
- Include a compact canonical constructor for parameter validation (not null, blank, etc.).
- Request DTOs contain input parameters for the API operation.
- Response DTOs contain the data structure returned to the client.
- Use `@ModelAttribute` annotation for Criteria DTOs and APIs that accept form data (multipart/form-data or application/x-www-form-urlencoded).
- Use `@ParameterObject` annotation from Springdoc OpenAPI for `Pageable` and `Sort` parameters to improve API documentation.
- Example:
```java
@GetMapping("/search")
public ResponseEntity<ApiResponse> searchUsers(
    @ModelAttribute UserSearchCriteria criteria,
    @ParameterObject Pageable pageable
) {
    Page<UserResponseDto> users = userService.searchUsers(criteria, pageable);
    return ResponseEntity.ok(ApiResponse.success("Users retrieved successfully", users));
}

@PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
public ResponseEntity<ApiResponse> createUser(
    @ModelAttribute UserCreateRequest request
) {
    UserResponseDto user = userService.createUser(request);
    return ResponseEntity.ok(ApiResponse.success("User created successfully", user));
}
```

## Spring Data JPA Specification Conventions
- **MANDATORY**: Use Specifications for all search and filtering operations in Repository layer.
- Create dedicated Specification classes for each entity (e.g., `UserSpecification`, `StudentSpecification`, `TeacherSpecification`).
- Place Specification classes in `repository/specification` package.
- Use static methods for each search criterion (e.g., `public static Specification<User> hasName(String name)`).
- Always handle null/empty values in Specification methods to avoid unnecessary query conditions.
- Use `Specification.where()` to combine multiple criteria with `.and()` and `.or()` methods.
- Repository interfaces must extend both `JpaRepository<Entity, ID>` and `JpaSpecificationExecutor<Entity>`.
- Example Specification class structure:
```java
@Component
public class UserSpecification {
    public static Specification<User> hasName(String name) {
        return (root, query, builder) -> {
            if (StringUtils.isBlank(name)) return null;
            return builder.like(builder.lower(root.get("name")), 
                               "%" + name.toLowerCase() + "%");
        };
    }
    
    public static Specification<User> hasEducationLevel(EducationLevel level) {
        return (root, query, builder) -> {
            if (level == null) return null;
            return builder.equal(root.get("educationLevel"), level);
        };
    }
    
    public static Specification<User> isActive() {
        return (root, query, builder) -> 
            builder.equal(root.get("status"), Status.ACTIVE);
    }
}
```
- Service layer usage: `repository.findAll(Specification.where(hasName(name)).and(hasEducationLevel(level)), pageable)`
- **NEVER create multiple @Query methods for different search combinations** - use Specifications instead.

## QueryDSL Conventions
- **Use QueryDSL for**: Complex queries with reusable join patterns or when join logic needs to be shared across multiple queries.
- Repository interfaces must extend `QuerydslPredicateExecutor<Entity>` for QueryDSL support.
- Create custom repository implementations for reusable join logic and complex query methods.
- Place custom repository implementations in `repository/custom` package.
- Use QueryDSL Q-classes generated by annotation processor (enable in pom.xml).
- Create reusable join methods in custom repository implementations to avoid code duplication.

### QueryDSL Repository Structure
```java
// Base repository interface
public interface UserRepository extends JpaRepository<User, Long>, 
                                       QuerydslPredicateExecutor<User>,
                                       UserRepositoryCustom {
}

// Custom repository interface
public interface UserRepositoryCustom {
    Page<UserDto> searchUsersWithOrders(UserSearchCriteria criteria, Pageable pageable);
    List<UserDto> findUsersWithActiveOrders(LocalDate startDate, LocalDate endDate);
}

// Custom repository implementation
@Repository
@RequiredArgsConstructor
public class UserRepositoryCustomImpl implements UserRepositoryCustom {
    private final JPAQueryFactory queryFactory;
    
    @Override
    public Page<UserDto> searchUsersWithOrders(UserSearchCriteria criteria, Pageable pageable) {
        QUser user = QUser.user;
        QOrder order = QOrder.order;
        
        JPAQuery<UserDto> query = queryFactory
            .select(Projections.constructor(UserDto.class,
                user.id,
                user.name,
                user.email,
                order.count()))
            .from(user)
            .leftJoin(user.orders, order)
            .where(buildPredicate(criteria, user, order))
            .groupBy(user.id, user.name, user.email);
        
        long total = query.fetchCount();
        List<UserDto> results = query
            .offset(pageable.getOffset())
            .limit(pageable.getPageSize())
            .fetch();
        
        return new PageImpl<>(results, pageable, total);
    }
    
    @Override
    public List<UserDto> findUsersWithActiveOrders(LocalDate startDate, LocalDate endDate) {
        return applyUserOrderJoin()
            .where(order.status.eq(OrderStatus.ACTIVE)
                .and(order.createdAt.between(startDate, endDate)))
            .fetch();
    }
    
    // Reusable join method
    private JPAQuery<UserDto> applyUserOrderJoin() {
        QUser user = QUser.user;
        QOrder order = QOrder.order;
        
        return queryFactory
            .select(Projections.constructor(UserDto.class,
                user.id,
                user.name,
                user.email,
                order.count()))
            .from(user)
            .leftJoin(user.orders, order)
            .groupBy(user.id, user.name, user.email);
    }
    
    // Reusable predicate builder
    private BooleanExpression buildPredicate(UserSearchCriteria criteria, QUser user, QOrder order) {
        BooleanExpression predicate = Expressions.asBoolean(true).isTrue();
        
        if (StringUtils.isNotBlank(criteria.getName())) {
            predicate = predicate.and(user.name.containsIgnoreCase(criteria.getName()));
        }
        
        if (criteria.getStatus() != null) {
            predicate = predicate.and(user.status.eq(criteria.getStatus()));
        }
        
        if (criteria.getMinOrderCount() != null) {
            predicate = predicate.and(order.count().goe(criteria.getMinOrderCount()));
        }
        
        return predicate;
    }
}
```

## Dependency Injection Best Practices
- **ALWAYS use constructor injection** instead of field injection (@Autowired).
- Declare all injected dependencies as `private final` fields.
- Use Lombok @RequiredArgsConstructor to generate constructor automatically.
- Constructor injection provides better testability and immutability.
- Avoid circular dependencies by proper separation of concerns.

## Exception Handling & Error Responses
- ApiResponse and GlobalExceptionHandler classes must be present and follow best practices for structure and error handling.
- ApiResponse should include only essential fields: status, message, and data (no timestamp field).
- Use consistent status values (e.g., "SUCCESS", "ERROR") and descriptive messages.
- **IMPORTANT**: NEVER hardcode error messages in exceptions or controllers. Always use error codes from ExceptionCode.java.
- For custom exceptions, pass the appropriate error code from ExceptionCode.java instead of literal strings.
- When adding new error scenarios, first add a constant to ExceptionCode.java, then reference it in your exception.
- Structure custom exceptions to accept error codes that can be used for i18n and consistent error handling.
- GlobalExceptionHandler should translate error codes into appropriate HTTP status codes and response formats.

### Error Code Naming Convention
- **MANDATORY**: Use dot-separated naming pattern with module/object prefix for error codes: `{MODULE}.{OBJECT}.{ERROR_NAME}`
- Error code constants should be in UPPERCASE with underscores, but their string values use dot notation
- This pattern provides better organization, reusability, and prevents naming conflicts across modules

**Structure Pattern**:
```
{MODULE}.{OBJECT}.{ERROR_NAME}
├── MODULE: The functional module (USER, ORDER, PAYMENT, AUTH, etc.)
├── OBJECT: The specific entity or feature (PROFILE, ACCOUNT, TRANSACTION, etc.)
└── ERROR_NAME: The specific error condition (NOT_FOUND, INVALID, DUPLICATE, etc.)
```

**Examples**:
```java
public class ExceptionCode {
    // User module errors
    public static final String USER_ACCOUNT_NOT_FOUND = "USER.ACCOUNT.NOT_FOUND";
    public static final String USER_ACCOUNT_INACTIVE = "USER.ACCOUNT.INACTIVE";
    public static final String USER_ACCOUNT_LOCKED = "USER.ACCOUNT.LOCKED";
    public static final String USER_PROFILE_INCOMPLETE = "USER.PROFILE.INCOMPLETE";
    public static final String USER_EMAIL_DUPLICATE = "USER.EMAIL.DUPLICATE";
    
    // Order module errors
    public static final String ORDER_PAYMENT_FAILED = "ORDER.PAYMENT.FAILED";
    public static final String ORDER_ITEM_OUT_OF_STOCK = "ORDER.ITEM.OUT_OF_STOCK";
    public static final String ORDER_STATUS_INVALID = "ORDER.STATUS.INVALID";
    
    // Authentication module errors
    public static final String AUTH_TOKEN_EXPIRED = "AUTH.TOKEN.EXPIRED";
    public static final String AUTH_TOKEN_INVALID = "AUTH.TOKEN.INVALID";
    public static final String AUTH_CREDENTIALS_INVALID = "AUTH.CREDENTIALS.INVALID";
    
    // Validation errors (reusable across modules)
    public static final String VALIDATION_FIELD_REQUIRED = "VALIDATION.FIELD.REQUIRED";
    public static final String VALIDATION_FORMAT_INVALID = "VALIDATION.FORMAT.INVALID";
    public static final String VALIDATION_LENGTH_EXCEEDED = "VALIDATION.LENGTH.EXCEEDED";
}
```

**Benefits**:
- Easy to locate errors by module/object in large codebases
- Prevents naming conflicts between similar errors in different modules
- Supports hierarchical error grouping for better organization
- Facilitates error code reusability within the same module
- Makes error code usage clearer: `throw new NotFoundException(ExceptionCode.USER_ACCOUNT_NOT_FOUND)`

**Usage in Code**:
```java
// In Service
if (user == null) {
    throw new NotFoundException(ExceptionCode.USER_ACCOUNT_NOT_FOUND);
}

if (!user.isActive()) {
    throw new BadRequestException(ExceptionCode.USER_ACCOUNT_INACTIVE);
}

// In GlobalExceptionHandler - error codes can be used for i18n lookups
@ExceptionHandler(NotFoundException.class)
public ResponseEntity<ApiResponse> handleNotFoundException(NotFoundException ex) {
    String message = messageSource.getMessage(ex.getErrorCode(), null, locale);
    return ResponseEntity.status(HttpStatus.NOT_FOUND)
        .body(ApiResponse.error(message));
}
```

## Liquibase Database Migration Conventions
- Use Liquibase for all database schema changes and data migrations.
- Never use Hibernate DDL auto (spring.jpa.hibernate.ddl-auto=none in production).
- All database changes must be versioned and tracked through Liquibase changesets.

### Liquibase File Structure
- Place all changesets in `src/main/resources/db/changelog/` directory.
- Use master changelog file `db.changelog-master.yaml` to include all changesets.
- Create separate changeset files for each logical change (table creation, column addition, etc.).
- Use naming convention: `YYYYMMDD-HHMMSS-description.yaml` for changeset files.

### Changeset Conventions
- Each changeset must have a unique ID using format: `YYYYMMDD-HHMMSS-sequence`.
- Always include author attribute with developer's name or initials.
- Use descriptive comments explaining the purpose of each changeset.
- Include rollback instructions where applicable using `rollback:` tag.
- Use `preconditions` to ensure changesets run only when appropriate.

### Database Object Naming
- Table names: lowercase with underscores (snake_case): `user_profiles`, `order_items`.
- Column names: lowercase with underscores (snake_case): `created_at`, `user_id`.
- Primary key columns: always named `id` with BIGSERIAL/BIGINT AUTO_INCREMENT.
- Foreign key columns: `{table_name}_id` format: `user_id`, `order_id`.
- Index names: `idx_{table}_{columns}` format: `idx_users_email`, `idx_orders_created_at`.
- Constraint names: `{type}_{table}_{columns}` format: `fk_orders_user_id`, `uk_users_email`.

### Changeset Best Practices
- Always test changesets on development database before committing.
- Use `splitStatements: false` for complex SQL blocks.
- Include `context` attribute for environment-specific changes.
- Use `labels` for categorizing changes (schema, data, index, etc.).
- Never modify existing changesets once they're deployed to any environment.
- Create new changesets for corrections or additional changes.

### Data Migration Guidelines
- Separate structure changes from data changes into different changesets.
- Use `loadData` for bulk data imports from CSV files.
- Place data files in `src/main/resources/db/data/` directory.
- Always backup data before running destructive operations.
- Use transactions appropriately with `runInTransaction: true/false`.

### Environment Management
- Use Liquibase contexts for environment-specific changes: `dev`, `test`, `prod`.
- Maintain separate property files for different environments.
- Never include sensitive data (passwords, API keys) directly in changesets.
- Use placeholders and property substitution for environment-specific values.
