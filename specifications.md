# Overview

'Organization' is a nonprofit organization supporting the education and well-being of underserved children, youth, and families in Los Angeles. Offering a range of services such as child care, counseling, family life education, school readiness, and community engagement opportunities, plus onsite facilities across multiple locations, public-facing staff address a large volume of reference questions and often experience challenges managing lines at information desks.

To help manage reference questions, we propose piloting a multilingual AI-powered kiosk as an additional point of service at the Charter Elementary School. This location has been selected based on high foot traffic and proximity to a wide range of internal and external stakeholders. Software would build on projects in libraries and information organizations using custom ChatGPT models, while also offering an accessible hardware solution based in a central, convenient location. Tentatively called a “Digital Family Resource Navigator,” this innovation is intended to increase capacity of public-facing staff and improve customer service by functioning as an expansion to the current information desk, providing assistance with basic reference questions, referring users to the appropriate organizational contacts and services, and addressing multilingual needs. It is not intended to replace existing staff , assist with complex questions, or provide expert advice. Depending on the project outcomes, kiosks may be rolled out to additional 'Organization' locations and the software may be added as a cloud-based application accessible on the 'Organization' website.

# Users

The user base of the kiosk would primarily consist of 'Organization' students (TK-5th grade), their families, and 'Organization' administrative staff.

Students are expected to interact with the kiosk to find information for their classes or as part of guided instructional exercises.

Families of students would likely seek information about 'Organization' services, contacts, and resources.

Placed next to the front desk, which serves as a gateway to the rest of campus, the administrative staff represent another core group who would interact with the kiosk to instruct others on its proper use, troubleshoot issues, and assist with maintenance. 'Organization' staff would also play a key role in observing user interactions, as well as evaluating the kiosk for accuracy, reliability, and user-friendliness.

# Use Cases

The kiosk will be used to answer common reference questions at the 'Organization' Charter Elementary School (CES), such as providing information about school schedules, program hours, enrollment procedures, program offerings, and contact information for specific programs and staff.

It will guide families to appropriate services such as family support, counseling, before and after school care, food and housing assistance, etc. Information will be presented in multiple languages to accommodate users with different preferred languages, and offer step-by-step instructions for common tasks like completing forms, contacting appropriate personnel, and finding additional services.

The kiosk will also support staff workload by reducing repetitive questions and serving as an additional point of service adjacent to the information desk.

The technology is not intended to replace staff or handle complex cases; rather, it will act as a reference tool that handles basic or routine inquiries. It will not collect identifying information, or handle crises, nor will it attempt to answer sensitive questions that require specialized judgment. The kiosk will use anonymous, choice-based navigation to guide users to appropriate services without collecting sensitive information. The kiosk never needs to know who the person is, only what kind of help they are seeking, ensuring privacy while still providing accurate information.

# Features & Functionality

## App Functionality

Responsive web app, breakpoints for desktop & mobile devices

Answer questions about organization policies and services

- Utilize Retrieval Augmented Generation (RAG) approach to search for and utilize content from organization documents and resources as basis for the generated answer.
- Provide name and link (when available) to resource for additional help

### Pending Functionality and Features

- TBD - Contacts/referrals based on publicly available resources/directory
- TBD - Tone & language adapts to user (student vs. parent/staff)
- TBD - Maintain context from conversation for related/follow up questions

### Out of Scope

- Personalized responses
- Inclusion of full document/resource in data sources
- Tailored recommendations to questions with no available data/resources

## Data/Document Processing

### Data Structure

- Store document/source name and link (if available)
- TODO: Review training data for other context to store
  - (section titles, page numbers, etc.)

### Data Workflow

1. Extract text from PDF documents in contextual sections
   - TBD - Automate document extraction
2. Embed text chunks and store as vectors
3. Store extracted and embedded data in local tsv (tab separated file)
4. Sync local data to postgres database

# Technical Specifications

[GitHub Repository](https://github.com/hops-on-pop/dfrn-prototype)

- Framework - NextJS v16
- Runtime - Bun
- Programming Language - Typescript
- Database - PostgreSQL with pgvector
- Lint & Formatting - Biome
- ORM - Drizzle ORM
- CSS Framework - Tailwind v4
- Component Library - ShadCN UI
- Application Hosting Platform - Vercel
- DB Hosting Platform - Supabase
- AI Framework -AI SDK
- Embedding Model - OpenAI text-embedding-3-small
- LLM Model - Open AI gpt-5.2
- PDF Processing Library - TBD
