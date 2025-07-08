export default defineNuxtRouteMiddleware(async (to) => {
  // Rotas que o middleware deve proteger
  const protectedRoutes = /^\/admin\//.test(to.path)
  const loginRoute = to.path === '/admin'

  if (protectedRoutes || loginRoute) {
    const { checkUser } = useAuth()
    const user = await checkUser()

    // Se o usuário não estiver logado e tentar acessar uma rota protegida
    if (!user && protectedRoutes) {
      return navigateTo('/admin') // Redireciona para a página de login
    }

    // Se o usuário já estiver logado e tentar acessar a página de login
    if (user && loginRoute) {
      return navigateTo('/admin/resumo') // Redireciona para o painel
    }
  }
})
