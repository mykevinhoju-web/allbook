# Hair Booking Platform — MVP ER Diagram

Physical table names avoid collisions with the dayspa tenant (`public.staff`, `public.bookings`).

| Spec | Physical table |
|------|----------------|
| business_categories | `business_categories` |
| suburbs | `suburbs` |
| salons | `salons` |
| staff | `salon_staff` |
| services | `salon_services` |
| business_hours | `business_hours` |
| customers | `salon_customers` |
| bookings | `salon_bookings` |

```mermaid
erDiagram
  business_categories ||--o{ salons : "category_id"
  suburbs ||--o{ salons : "suburb_id"
  salons ||--o{ salon_staff : "salon_id"
  salons ||--o{ salon_services : "salon_id"
  salons ||--o{ business_hours : "salon_id"
  salons ||--o{ salon_customers : "salon_id"
  salons ||--o{ salon_bookings : "salon_id"
  salon_customers ||--o{ salon_bookings : "customer_id"
  salon_staff ||--o{ salon_bookings : "staff_id"
  salon_services ||--o{ salon_bookings : "service_id"

  business_categories {
    uuid id PK
    text name
    text slug UK
    timestamptz created_at
    timestamptz updated_at
    timestamptz deleted_at
  }

  suburbs {
    uuid id PK
    text name
    text postcode
    float8 latitude
    float8 longitude
    timestamptz created_at
    timestamptz updated_at
    timestamptz deleted_at
  }

  salons {
    uuid id PK
    uuid category_id FK
    text name
    text slug UK
    text description
    text phone
    text email
    text website
    text address
    uuid suburb_id FK
    float8 latitude
    float8 longitude
    text cover_image
    text logo
    text status
    timestamptz created_at
    timestamptz updated_at
    timestamptz deleted_at
  }

  salon_staff {
    uuid id PK
    uuid salon_id FK
    text name
    text role
    text photo
    text phone
    text email
    text status
    timestamptz created_at
    timestamptz updated_at
    timestamptz deleted_at
  }

  salon_services {
    uuid id PK
    uuid salon_id FK
    text name
    int duration
    int price
    text description
    bool active
    timestamptz created_at
    timestamptz updated_at
    timestamptz deleted_at
  }

  business_hours {
    uuid id PK
    uuid salon_id FK
    smallint day_of_week
    time open_time
    time close_time
    bool closed
    timestamptz created_at
    timestamptz updated_at
    timestamptz deleted_at
  }

  salon_customers {
    uuid id PK
    uuid salon_id FK
    text first_name
    text last_name
    text phone
    text email
    timestamptz created_at
    timestamptz updated_at
    timestamptz deleted_at
  }

  salon_bookings {
    uuid id PK
    uuid salon_id FK
    uuid customer_id FK
    uuid staff_id FK
    uuid service_id FK
    date booking_date
    time start_time
    time end_time
    text status
    text notes
    timestamptz created_at
    timestamptz updated_at
    timestamptz deleted_at
  }
```

## RLS (summary)

| Table | Public read | Public write |
|-------|-------------|--------------|
| business_categories | live rows | platform admin |
| suburbs | live rows | platform admin |
| salons | live + `status=active` | platform admin |
| salon_staff | live + active + salon active | service role |
| salon_services | live + active + salon active | service role |
| business_hours | live + salon active | service role |
| salon_customers | none (PII) | insert for booking |
| salon_bookings | live rows | insert pending/confirmed |

Soft delete: always filter `deleted_at IS NULL`.
