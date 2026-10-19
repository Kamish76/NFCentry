import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function AuthErrorPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Sorry, something went wrong.</CardTitle>
      </CardHeader>
      <CardContent>
        {params?.error ? (
          <p className="text-sm text-muted-foreground">Error: {params.error}</p>
        ) : (
          <p className="text-sm text-muted-foreground">An unspecified error occurred.</p>
        )}
      </CardContent>
    </Card>
  )
}
