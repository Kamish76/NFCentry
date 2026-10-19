import { CompleteProfileForm } from '@/components/complete-profile-form'

export default function CompleteProfilePage() {
  return (
    <div className="flex min-h-[80vh] w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-md">
        <CompleteProfileForm />
      </div>
    </div>
  )
}
