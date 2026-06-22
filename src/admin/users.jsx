import './users.css'
import { useState } from 'react'
import UserFormModal from './users/UserFormModal.jsx'
import UserDetailsPanel from './users/UserDetailsPanel.jsx'
import UsersHeader from './users/UsersHeader.jsx'
import UsersManagementTable from './users/UsersManagementTable.jsx'
import UsersQuickActionsCard from './users/UsersQuickActionsCard.jsx'
import useUsersData from './users/useUsersData.jsx'
import useUsersPageState from './users/useUsersPageState.jsx'
import AdminSidebar from './sidebar.jsx'

function AdminUsers({ onLogout }) {
  const [search, setSearch] = useState('')
  const {
    filteredUsers,
    isLoading,
    loadError,
    selectedUser,
    selectedUserId,
    setSelectedUserId,
    createUserAccount,
    updateUserAccount,
    deleteUserAccount,
    creatingUserEmail,
    savingUserId,
    deletingUserId,
  } = useUsersData(search)

  const {
    isMobileNavOpen,
    isCreateModalOpen,
    isEditModalOpen,
    createForm,
    editForm,
    editUserId,
    actionFeedback,
    handleToggleMobileNav,
    handleCloseMobileNav,
    handleOpenCreateModal,
    handleCloseCreateModal,
    handleStartEdit,
    handleCloseEditModal,
    handleCreateFieldChange,
    handleEditFieldChange,
    handleCreateSubmit,
    handleEditSubmit,
    handleDeleteUser,
  } = useUsersPageState({
    createUserAccount,
    updateUserAccount,
    deleteUserAccount,
    setSelectedUserId,
  })

  return (
    <main className="admin-users-page">
      <div className={`admin-users-shell${isMobileNavOpen ? ' is-nav-open' : ''}`}>
        <div id="admin-users-sidebar" className="admin-users-sidebar-wrap">
          <AdminSidebar
            baseClass="admin-users"
            activeItem="users"
            onNavigate={() => {
              handleCloseMobileNav()
            }}
          />
        </div>

        <section className="admin-users-content">
          <UsersHeader isMobileNavOpen={isMobileNavOpen} onToggleMobileNav={handleToggleMobileNav} onLogout={onLogout} />

          <div className="admin-users-grid">
            <UsersManagementTable
              search={search}
              onSearchChange={setSearch}
              onOpenCreateModal={handleOpenCreateModal}
              filteredUsers={filteredUsers}
              isLoading={isLoading}
              loadError={loadError}
              selectedUserId={selectedUserId}
              onViewDetails={setSelectedUserId}
              onStartEdit={handleStartEdit}
              onDeleteUser={handleDeleteUser}
              deletingUserId={deletingUserId}
            />

            <aside className="admin-users-side-panels">
              <UserDetailsPanel user={selectedUser} />
              <UsersQuickActionsCard actionFeedback={actionFeedback} />
            </aside>
          </div>
        </section>
        <button
          type="button"
          className="admin-users-mobile-overlay"
          aria-label="Close navigation menu"
          onClick={handleCloseMobileNav}
        />

        {isCreateModalOpen && (
          <UserFormModal
            mode="create"
            form={createForm}
            onChangeField={handleCreateFieldChange}
            onClose={handleCloseCreateModal}
            onSubmit={handleCreateSubmit}
            actionFeedback={actionFeedback}
            isSubmitting={Boolean(creatingUserEmail)}
          />
        )}

        {isEditModalOpen && (
          <UserFormModal
            mode="edit"
            userId={editUserId}
            form={editForm}
            onChangeField={handleEditFieldChange}
            onClose={handleCloseEditModal}
            onSubmit={handleEditSubmit}
            actionFeedback={actionFeedback}
            isSubmitting={savingUserId === editUserId}
          />
        )}
      </div>
    </main>
  )
}

export default AdminUsers


