# Team Structure and Roles Template

## Scope
applyTo: "**"

## Team Overview

### Team Information
- **Team Name**: Integration and DevOps Tooling (IDS)
- **Organization**: IT
- **Tribe**: BTE Tribe
- **Domain**: IDS
- **Default Project**: IT
- **Area Path**: IT\\BTE Tribe\\Integration and DevOps Tooling

## Leadership Structure

### Business Leadership

#### Business Owner
- **Name**: Adrian Albuquerque
- **Email**: Adrian.Albuquerque@one.nz
- **Role**: Strategic decision making, business alignment, stakeholder management
- **Responsibilities**:
  - Business case development and approval
  - Stakeholder communication and relationship management
  - Strategic alignment with organizational objectives
  - Budget and resource allocation decisions

#### Product Owner
- **Name**: Yash Yash
- **Email**: Yash.Yash@one.nz
- **Role**: Product vision, requirements definition, backlog prioritization
- **Responsibilities**:
  - Product roadmap development and maintenance
  - User story creation and acceptance criteria definition
  - Backlog prioritization and grooming
  - Stakeholder requirements gathering and translation

### Technical Leadership

#### Engineering Lead & Platform Owner
- **Name**: Ashish Shivhare
- **Email**: Ashish.Shivhare@one.nz
- **Role**: Technical strategy, architecture decisions, engineering excellence
- **Responsibilities**:
  - Technical architecture and design decisions
  - Engineering standards and best practices
  - Technical risk assessment and mitigation
  - Cross-team technical coordination

#### Integration Tech Lead
- **Name**: Sanjeev Lokavarapu
- **Email**: Sanjeev.Lokavarapu@one.nz
- **Role**: Integration platform technical leadership
- **Responsibilities**:
  - Integration architecture and patterns
  - MuleSoft platform governance
  - API design and standards
  - Integration solution design

#### DevOps Tech Lead
- **Name**: Yash Yash
- **Email**: yash.yash@one.nz
- **Role**: DevOps practices and platform technical leadership
- **Responsibilities**:
  - CI/CD pipeline design and implementation
  - Infrastructure as Code practices
  - DevOps tooling and automation
  - Platform reliability and monitoring


### Delivery Management

#### Delivery Lead
- **Name**: Farhan Sarfraz
- **Email**: Farhan.Sarfraz@one.nz
- **Role**: Delivery coordination, project management, process facilitation
- **Responsibilities**:
  - Sprint planning and execution coordination
  - Cross-team dependency management
  - Delivery timeline management
  - Process improvement and facilitation

#### Scrum Master
- **Name**: Sajith Samarakoon
- **Email**: Sajith.Samarakoon@one.nz
- **Role**: Agile process facilitation, team coaching, impediment removal
- **Responsibilities**:
  - Facilitate daily standups, sprint planning, and retrospectives
  - Coach team on Agile practices and principles
  - Remove impediments to team progress
  - Ensure adherence to Agile methodologies
  
## Team Members

### Integration Engineers

#### Senior MuleSoft Engineers
- **Aditi Lakhanpal**: Principal Engineer
  - **Skills**: MuleSoft, OpenShift, IBM API Connect, Go Language
  - **Focus**: Complex integration solutions, platform architecture
- **Pramay Birwatkar**: Principal Engineer
  - **Skills**: MuleSoft platform expertise
  - **Focus**: Integration patterns, solution architecture

#### MuleSoft Engineers
- **Vamshi Arelli**: MuleSoft Engineer
  - **Skills**: MuleSoft development and implementation
  - **Focus**: Integration development, API implementation
- **Kartik Muduli**: MuleSoft Engineer
  - **Skills**: MuleSoft development and implementation
  - **Focus**: Integration development, data transformation

#### Platform Engineers
- **Neethu Babu**: Engineer
  - **Skills**: ProSFTP, XMLGW
  - **Focus**: Legacy platform management, protocol gateways

### DevOps Engineers

#### DevOps Team Members
- **Iryn Rudy**: DevOps Engineer
  - **Skills**: Azure DevOps, Azure Pipelines, GitHub Actions, Terraform
  - **Focus**: CI/CD automation, infrastructure provisioning
- **Chandru Balu**: DevOps Engineer
  - **Skills**: Azure DevOps, Azure Pipelines, GitHub Actions, Terraform
  - **Focus**: Pipeline optimization, deployment automation
- **Tristan Hambling**: DevOps Engineer
  - **Skills**: Azure DevOps, Azure Pipelines, GitHub Actions, Terraform
  - **Focus**: Infrastructure management, monitoring and alerting

## Role Assignments for Work Items

### Default Assignments by Work Item Type

#### Initiatives
- **Business Owner**: Adrian Albuquerque
- **Technical Owner**: Ashish Shivhare
- **Primary Assignee**: Yash Yash (Process Owner)

#### Epics
- **Epic Owner**: Yash Yash
- **Business Owner**: Adrian Albuquerque
- **Delivery Lead**: Farhan Sarfraz
- **Tech Lead**: Sanjeev Lokavarapu (integration) / Yash Yash (DevOps)
- **Process Owner**: Yash Yash
- **Platform Owner**: Always Ashish Shivhare 

#### Features
- **Product Owner**: Yash Yash
- **Business Owner**: Adrian Albuquerque
- **Delivery Lead**: Farhan Sarfraz
- **Tech Lead**: Based on domain (Integration: Sanjeev, DevOps: Yash)
- **Process Owner**: Yash Yash
- **Platform Owner**: Always Ashish Shivhare 

#### User Stories
- **Assigned To**: Based on skills and workload distribution
- **Integration Stories**: Vamshi Arelli, Kartik Muduli, Aditi Lakhanpal, Pramay Birwatkar
- **DevOps Stories**: Iryn Rudy, Chandru Balu, Tristan Hambling
- **Platform Stories**: Neethu Babu

#### Tasks
- **Assigned To**: Based on specific skills required and current capacity
- **MuleSoft Tasks**: Integration team members
- **Infrastructure Tasks**: DevOps team members
- **Documentation Tasks**: Distributed based on domain expertise

## Platforms
### Integration Platforms
- **MuleSoft**: Primary integration platform for API management and orchestration
- **IBM API Connect**: Secondary platform for API management
- **OpenShift**: Container orchestration platform for deploying integration solutions
- **ProSFTP**: Legacy file transfer protocol management
- **XMLGW**: XML Gateway for protocol translation and integration
- **Go Language**: Used for custom integration solutions and microservices
- **AWS API Gateway**: For managing APIs in AWS environment

### DevOps Platforms
- **Azure DevOps**: Primary platform for CI/CD, project management, and source control
- **Azure Pipelines**: For building and deploying applications
- **Azure pipeline Agents**: For running CI/CD jobs on various environments (on-prem, OCP & Azure ScaleSet)
- **Karate Server**: For API testing and validation (AWS 3 instances + OCP 3 instances)
- **GitHub Copilot**: AI-powered code completion and suggestions
- **SonarQube**: Code quality and security analysis
- **Nexus Repository**: Artifact management for build outputs
- **Redhat Quay**: Container image registry for OpenShift deployments
- **HashiCorp Vault**: Secrets management for secure storage of sensitive information

### Collaboration and Documentation Tools
- **Atlassian Confluence**: Documentation and knowledge sharing
- **Miro**: Internal communication and collaboration tool

## Skill Matrix

### Integration Domain

| Team Member        | MuleSoft | IBM API Connect | OpenShift | Go Language | ProSFTP | XMLGW | AWS API Gateway |
|--------------------|----------|-----------------|-----------|-------------|---------|-------|-----------------|
| Aditi Lakhanpal    | ★★★★★   | ★★★★★          | ★★★★★    | ★★★★★      | ★☆☆☆☆  | ★☆☆☆☆| ★★★☆☆          |
| Pramay Birwatkar   | ★★★★★   | ★★☆☆☆          | ★★☆☆☆    | ★☆☆☆☆      | ★☆☆☆☆  | ★☆☆☆☆| ★★☆☆☆          |
| Vamshi Arelli      | ★★★★☆   | ☆☆☆☆☆          | ☆☆☆☆☆    | ★☆☆☆☆      | ★☆☆☆☆  | ★☆☆☆☆| ★☆☆☆☆          |
| Kartik Muduli      | ★★★★☆   | ☆☆☆☆☆          | ★★☆☆☆    | ★☆☆☆☆      | ★☆☆☆☆  | ★☆☆☆☆| ★☆☆☆☆          |
| Neethu Babu        | ☆☆☆☆☆   | ☆☆☆☆☆          | ★☆☆☆☆    | ★☆☆☆☆      | ★★★★★  | ★★★★★| ☆☆☆☆☆          |

### DevOps Domain

| Team Member      | Azure DevOps | Azure Pipelines | GitHub Actions | Terraform | Docker | Kubernetes | Karate | SonarQube | Nexus | Vault |
|------------------|--------------|-----------------|----------------|-----------|--------|------------|--------|-----------|-------|-------|
| Iryn Rudy        | ★★★★★        | ★★★★★          | ★★★★☆         | ★★★★☆    | ★★★☆☆ | ★★★☆☆     | ★★★☆☆ | ★★★☆☆    | ★★☆☆☆| ★★☆☆☆|
| Chandru Balu     | ★★★★★        | ★★★★★          | ★★★★☆         | ★★★★☆    | ★★★☆☆ | ★★★☆☆     | ★★★☆☆ | ★★★☆☆    | ★★☆☆☆| ★★☆☆☆|
| Tristan Hambling | ★★★★★        | ★★★★★          | ★★★★☆         | ★★★★☆    | ★★★☆☆ | ★★★☆☆     | ★★★☆☆ | ★★★☆☆    | ★★☆☆☆| ★★☆☆☆|

### Platform and Container Registry

| Team Member      | RedHat Quay | OpenShift | GitHub Copilot | Confluence | Miro |
|------------------|-------------|-----------|----------------|------------|------|
| Aditi Lakhanpal  | ★★★★☆      | ★★★★★    | ★★★★☆         | ★★★☆☆    | ★★☆☆☆|
| Pramay Birwatkar | ★★★☆☆      | ★★☆☆☆    | ★★★☆☆         | ★★★☆☆    | ★★☆☆☆|
| Vamshi Arelli    | ★★☆☆☆      | ☆☆☆☆☆    | ★★★☆☆         | ★★☆☆☆    | ★★☆☆☆|
| Kartik Muduli    | ★★☆☆☆      | ★★☆☆☆    | ★★★☆☆         | ★★☆☆☆    | ★★☆☆☆|
| Neethu Babu      | ★☆☆☆☆      | ★☆☆☆☆    | ★★☆☆☆         | ★★★☆☆    | ★★☆☆☆|
| Iryn Rudy        | ★★★★☆      | ★★★☆☆    | ★★★★☆         | ★★★☆☆    | ★★★☆☆|
| Chandru Balu     | ★★★★☆      | ★★★☆☆    | ★★★★☆         | ★★★☆☆    | ★★★☆☆|
| Tristan Hambling | ★★★★☆      | ★★★☆☆    | ★★★★☆         | ★★★☆☆    | ★★★☆☆|

**Rating Scale**: ★☆☆☆☆ (1-Beginner) to ★★★★★ (5-Expert)

## Communication Structure

### Regular Meetings
- **Daily Standups**: 3:30 PM NZDT daily (all team members)
  - Duration: 15 minutes
  - Platform: Microsoft Teams
- **Sprint Planning**: Bi-weekly (all team members)
  - Duration: 2-4 hours depending on sprint complexity
  - Platform: Microsoft Teams + Azure DevOps
- **Sprint Retrospectives**: Bi-weekly (all team members)
  - Duration: 1-2 hours
  - Platform: Microsoft Teams + Miro
- **Backlog Refinement**: Weekly (Product Owner, Tech Leads, selected team members)
  - Duration: 1-2 hours
  - Platform: Microsoft Teams + Azure DevOps
- **Architecture Reviews**: As needed (Engineering Lead, Tech Leads, relevant team members)
  - Duration: 1-3 hours depending on complexity
  - Platform: Microsoft Teams + Confluence

### Escalation Path
1. **Team Member** → **Tech Lead** (domain-specific)
2. **Tech Lead** → **Engineering Lead**
3. **Engineering Lead** → **Business Owner**
4. **Cross-functional issues** → **Delivery Lead** → **Business Owner**

## Capacity Planning

### Team Capacity (per sprint - 2 weeks)
- **Integration Team**: ~160 hours (4 members × 8 hours × 5 days × 2 weeks)
- **DevOps Team**: ~120 hours (3 members × 8 hours × 5 days × 2 weeks)
- **Platform Team**: ~40 hours (1 member × 8 hours × 5 days × 2 weeks)
- **Total Development Capacity**: ~320 hours per sprint

### Leadership Time Allocation
- **Technical Leadership**: ~25% capacity for hands-on work
- **Delivery Management**: ~10% capacity for hands-on work
- **Product Management**: Dedicated to product activities

## Work Assignment Guidelines

### Assignment Criteria
1. **Skill Match**: Primary consideration for technical assignments
2. **Capacity**: Current workload and availability
3. **Development**: Opportunities for skill growth and learning
4. **Domain**: Integration vs DevOps vs Platform work
5. **Priority**: Business priority and urgency

### Cross-Training Priorities
1. **DevOps Skills**: All team members should have basic CI/CD knowledge
2. **Integration Patterns**: DevOps team should understand integration concepts
3. **Platform Knowledge**: Shared understanding of legacy and modern platforms
4. **Security Practices**: All team members should understand security requirements

## Role Management

### Multiple Role Assignments
- **Yash Yash** serves in multiple capacities:
  - Product Owner (primary responsibility)
  - DevOps Tech Lead (technical expertise)
  - Process Owner (coordination activities)
- **Conflict Resolution**: When priorities conflict, Product Owner responsibilities take precedence
- **Delegation**: Technical leadership tasks can be delegated to senior team members when needed

### Coverage and Backup Assignments
- **Product Owner Backup**: Farhan Sarfraz (Delivery Lead)
- **DevOps Tech Lead Backup**: Ashish Shivhare (Engineering Lead)
- **Integration Tech Lead Backup**: Ashish Shivhare (Engineering Lead)
- **Scrum Master Backup**: Farhan Sarfraz (Delivery Lead)
- **Emergency Technical Contact**: Ashish Shivhare (24/7 availability for critical issues)

### Holiday and Leave Coverage
- **Minimum 2 weeks notice** required for planned leave
- **Cross-training documentation** must be updated before extended leave
- **Handover sessions** required for ongoing work items
- **Emergency contacts** must be available during business hours

This structure ensures clear roles, responsibilities, and effective work distribution across the Integration and DevOps Tooling team.
