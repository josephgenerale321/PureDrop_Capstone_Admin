import './users.css'
import { useState } from 'react'
import UserFormModal from './users/UserFormModal.jsx'
import UserDetailsModal from './users/UserDetailsModal.jsx'
import UsersHeader from './users/UsersHeader.jsx'
import UsersManagementTable from './users/UsersManagementTable.jsx'
import useUsersData from './users/useUsersData.jsx'
import useUsersPageState from './users/useUsersPageState.jsx'
import AdminSidebar from './sidebar.jsx'
import useAdminMobileNav from './useAdminMobileNav.js'

function AdminUsers({ onLogout }) {
  const [search, setSearch] = useState('')
  const { isMobileNavOpen, toggleMobileNav, closeMobileNav } = useAdminMobileNav()
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
    updateUserStatus,
    sendPasswordReset,
    sendVerificationEmail,
    creatingUserEmail,
    savingUserId,
    deletingUserId,
  } = useUsersData(search)

  const {
    isCreateModalOpen,
    isEditModalOpen,
    isDetailsModalOpen,
    isConfirmCloseOpen,
    isEditDirty,
    createForm,
    editForm,
    editUserId,
    editFieldErrors,
    editValidatedFields,
    editUserName,
    editUserEmail,
    actionFeedback,
    handleOpenCreateModal,
    handleCloseCreateModal,
    handleStartEdit,
    handleCloseEditModal,
    handleConfirmDiscard,
    handleCancelDiscard,
    handleOpenDetailsModal,
    handleCloseDetailsModal,
    handleCreateFieldChange,
    handleEditFieldChange,
    handleEditFieldBlur,
    handleEditReset,
    handleCreateSubmit,
    handleEditSubmit,
    handleSendPasswordReset,
    handleSendVerificationEmail,
    handleDeleteUser,
  } = useUsersPageState({
    createUserAccount,
    updateUserAccount,
    deleteUserAccount,
    setSelectedUserId,
    updateUserStatus,
    sendPasswordReset,
    sendVerificationEmail,
  })

  const handleViewUserDetails = (userId) => {
    setSelectedUserId(userId)
    handleOpenDetailsModal()
  }

  return (
    <main className="admin-users-page">
      <div className={`admin-users-shell${isMobileNavOpen ? ' is-nav-open' : ''}`}>
        <div id="admin-users-sidebar" className="admin-users-sidebar-wrap">
          <AdminSidebar activeItem="users" onClose={closeMobileNav} />
        </div>

        <section className="admin-users-content">
          <UsersHeader isMobileNavOpen={isMobileNavOpen} onToggleMobileNav={toggleMobileNav} onLogout={onLogout} />

          <div className="admin-users-grid">
            <UsersManagementTable
              search={search}
              onSearchChange={setSearch}
              onOpenCreateModal={handleOpenCreateModal}
              filteredUsers={filteredUsers}
              isLoading={isLoading}
              loadError={loadError}
              selectedUserId={selectedUserId}
              onViewDetails={handleViewUserDetails}
              onStartEdit={handleStartEdit}
              onDeleteUser={handleDeleteUser}
              deletingUserId={deletingUserId}
            />
          </div>
        </section>
        <button
          type="button"
          className="admin-users-mobile-overlay"
          aria-label="Close navigation menu"
          onClick={closeMobileNav}
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
            userName={editUserName}
            userEmail={editUserEmail}
            form={editForm}
            onChangeField={handleEditFieldChange}
            onClose={handleCloseEditModal}
            onSubmit={handleEditSubmit}
            actionFeedback={actionFeedback}
            isSubmitting={savingUserId === editUserId}
            fieldErrors={editFieldErrors}
            validatedFields={editValidatedFields}
            onFieldBlur={handleEditFieldBlur}
            onReset={handleEditReset}
            isDirty={isEditDirty}
            isConfirmCloseOpen={isConfirmCloseOpen}
            onConfirmDiscard={handleConfirmDiscard}
            onCancelDiscard={handleCancelDiscard}
            onSendPasswordReset={handleSendPasswordReset}
            onSendVerificationEmail={handleSendVerificationEmail}
            emailVerified={selectedUser?.emailVerified ?? false}
          />
        )}

        {isDetailsModalOpen && (
          <UserDetailsModal
            user={selectedUser}
            onClose={handleCloseDetailsModal}
          />
        )}
      </div>
    </main>
  )
}

export default AdminUsers


