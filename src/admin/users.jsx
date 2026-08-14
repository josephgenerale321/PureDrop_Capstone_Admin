import './users.css'
import { useState } from 'react'
import UserFormModal from './users/UserFormModal.jsx'
import UserDetailsModal from './users/UserDetailsModal.jsx'
import DeleteUserConfirmModal from './users/DeleteUserConfirmModal.jsx'
import UsersHeader from './users/UsersHeader.jsx'
import UsersManagementTable from './users/UsersManagementTable.jsx'
import useUsersData from './users/useUsersData.jsx'
import useUsersPageState from './users/useUsersPageState.jsx'
import AdminSidebar from './sidebar.jsx'
import useAdminMobileNav from './useAdminMobileNav.js'
import useLogout from './useLogout.js'
import LogoutConfirmModal from './LogoutConfirmModal.jsx'

function AdminUsers({ onLogout }) {
  const [search, setSearch] = useState('')
  const { isMobileNavOpen, toggleMobileNav, closeMobileNav } = useAdminMobileNav()
  const {
    isLogoutModalOpen,
    isSigningOut,
    logoutError,
    confirmLogout,
    closeLogoutModal,
    handleConfirmLogout,
  } = useLogout(onLogout)
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
    setUserPassword,
    sendVerificationEmail,
    verifyEmailOtp,
    markEmailVerified,
    creatingUserEmail,
    savingUserId,
    deletingUserId,
  } = useUsersData(search)

  const {
    newPassword,
    setNewPassword,
    confirmNewPassword,
    setConfirmNewPassword,
    isUpdatingPassword,
    handleSetUserPassword,
    verificationCode,
    setVerificationCode,
    isVerificationCodeSent,
    isVerifyingEmail,
    isEmailVerified,
    handleSendCreateVerificationCode,
    handleVerifyCreateEmailCode,
    handleMarkEmailVerified,
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
    handleSendVerificationEmail,
    isDeleteModalOpen,
    deleteTarget,
    deleteError,
    isDeleteSubmitting,
    handleOpenDeleteModal,
    handleCloseDeleteModal,
    handleConfirmDelete,
  } = useUsersPageState({
    createUserAccount,
    updateUserAccount,
    deleteUserAccount,
    setSelectedUserId,
    updateUserStatus,
    setUserPassword,
    sendVerificationEmail,
    verifyEmailOtp,
    markEmailVerified,
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
          <UsersHeader isMobileNavOpen={isMobileNavOpen} onToggleMobileNav={toggleMobileNav} onLogout={confirmLogout} />

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
              onDeleteUser={handleOpenDeleteModal}
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
            verificationCode={verificationCode}
            onChangeVerificationCode={setVerificationCode}
            isVerificationCodeSent={isVerificationCodeSent}
            isVerifyingEmail={isVerifyingEmail}
            isEmailVerified={isEmailVerified}
            onSendVerificationCode={handleSendCreateVerificationCode}
            onVerifyEmailCode={handleVerifyCreateEmailCode}
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
            onSendPasswordReset={handleSetUserPassword}
            onSendVerificationEmail={handleSendVerificationEmail}
            emailVerified={selectedUser?.emailVerified ?? false}
            newPassword={newPassword}
            confirmNewPassword={confirmNewPassword}
            isUpdatingPassword={isUpdatingPassword}
            onChangeNewPassword={setNewPassword}
            onChangeConfirmNewPassword={setConfirmNewPassword}
          />
        )}

        {isDetailsModalOpen && (
          <UserDetailsModal
            user={selectedUser}
            onClose={handleCloseDetailsModal}
          />
        )}
      </div>

      <DeleteUserConfirmModal
        isOpen={isDeleteModalOpen}
        userName={deleteTarget?.name || ''}
        userEmail={deleteTarget?.email || ''}
        isDeleting={isDeleteSubmitting}
        error={deleteError}
        onConfirm={handleConfirmDelete}
        onClose={handleCloseDeleteModal}
      />

      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        isSigningOut={isSigningOut}
        error={logoutError}
        userEmail={''}
        onConfirm={handleConfirmLogout}
        onClose={closeLogoutModal}
      />
    </main>
  )
}

export default AdminUsers