import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Helmet } from "react-helmet-async"
import { Briefcase, Upload, Send, CheckCircle2 } from "lucide-react"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { useLanguage } from "@/contexts/LanguageContext"

const Cariera = () => {
  const { t, language } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [cvFile, setCvFile] = useState<File | null>(null)
  const { toast } = useToast()

  const jobApplicationSchema = z.object({
    fullName: z.string().min(3, t.career.validationErrors.nameMin),
    email: z.string().email(t.career.validationErrors.emailInvalid),
    phone: z.string().min(10, t.career.validationErrors.phoneInvalid),
    position: z.string().min(1, t.career.validationErrors.positionRequired),
    experience: z.string().min(1, t.career.validationErrors.experienceRequired),
    coverLetter: z.string().min(50, t.career.validationErrors.coverLetterMin),
  })

  type JobApplicationForm = z.infer<typeof jobApplicationSchema>

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<JobApplicationForm>({
    resolver: zodResolver(jobApplicationSchema),
  })

  const position = watch("position")
  const experience = watch("experience")

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: t.career.fileTooLarge,
          description: t.career.fileTooLargeMessage,
          variant: "destructive",
        })
        return
      }
      if (!file.type.includes("pdf") && !file.type.includes("doc")) {
        toast({
          title: t.career.invalidFormat,
          description: t.career.invalidFormatMessage,
          variant: "destructive",
        })
        return
      }
      setCvFile(file)
    }
  }

  const onSubmit = async (data: JobApplicationForm) => {
    setIsSubmitting(true)

    try {
      let cvData = null

      // Convert CV to base64 if provided
      if (cvFile) {
        const reader = new FileReader()
        const cvBase64 = await new Promise<string>((resolve) => {
          reader.onloadend = () => {
            const base64 = reader.result as string
            resolve(base64.split(",")[1])
          }
          reader.readAsDataURL(cvFile)
        })

        cvData = {
          filename: cvFile.name,
          content: cvBase64,
          contentType: cvFile.type,
        }
      }

      const { error } = await supabase.functions.invoke("send-job-application", {
        body: {
          fullName: data.fullName,
          email: data.email,
          phone: data.phone,
          position: data.position,
          experience: data.experience,
          coverLetter: data.coverLetter,
          cv: cvData,
        },
      })

      if (error) throw error

      toast({
        title: t.career.successTitle,
        description: t.career.successMessage,
      })

      reset()
      setCvFile(null)
    } catch (error) {
      console.error("Error submitting application:", error)
      toast({
        title: t.career.errorTitle,
        description: t.career.errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Helmet>
        <title>{language === 'ro' ? 'Carieră Agent Imobiliar - Alătură-te Echipei MVA Imobiliare București' : 'Real Estate Agent Career - Join MVA Imobiliare Team Bucharest'}</title>
        <meta
          name="description"
          content={t.career.heroSubtitle}
        />
        <meta name="keywords" content="job agent imobiliar, carieră imobiliare București, angajare consultant imobiliar, locuri de muncă imobiliare, agent vânzări proprietăți" />
        <link rel="canonical" href="https://mvaimobiliare.ro/cariera" />
        
        {/* AI Crawler Optimization */}
        <meta name="summary" content="MVA Imobiliare recrutează agenți imobiliari în București. Poziție: Agent Imobiliar pentru proprietăți premium. Oferim: training profesional gratuit, comisioane competitive (50-70%), suport marketing complet, portofoliu exclusiv de proprietăți, oportunități de creștere rapidă. Locație: București, Chiajna. Aplicare: contact@mvaimobiliare.ro sau 0767941512." />
        <meta name="category" content="Job Posting" />
        <meta name="employment-type" content="Full-time, Commission-based" />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://mvaimobiliare.ro/cariera" />
        <meta property="og:title" content={language === 'ro' ? 'Carieră Agent Imobiliar - MVA Imobiliare' : 'Real Estate Agent Career - MVA Imobiliare'} />
        <meta property="og:description" content={t.career.heroSubtitle} />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary" />
        <meta property="twitter:title" content={language === 'ro' ? 'Carieră MVA Imobiliare' : 'Career MVA Imobiliare'} />
        
        {/* Structured Data - Job Posting */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "JobPosting",
            "title": t.career.positions["agent-imobiliar"],
            "description": t.career.heroSubtitle,
            "hiringOrganization": {
              "@type": "Organization",
              "name": "MVA Imobiliare",
              "sameAs": "https://mvaimobiliare.ro"
            },
            "jobLocation": {
              "@type": "Place",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "București",
                "addressCountry": "RO"
              }
            },
            "employmentType": "FULL_TIME",
            "datePosted": "2024-01-01"
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/10">
        <Header />

        <main className="container mx-auto px-4 pt-32 pb-20" role="main">
          {/* Hero Section */}
          <header className="max-w-4xl mx-auto text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-gold/20 mb-6">
              <Briefcase className="w-4 h-4 text-gold" />
              <span className="text-sm text-gold">{t.career.badge}</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-cinzel font-bold mb-6 bg-gradient-to-r from-gold via-gold-light to-gold bg-clip-text text-transparent">
              {t.career.heroTitle}
            </h1>

            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              {t.career.heroSubtitle}
            </p>
          </header>

          {/* Benefits Section */}
          <section className="max-w-6xl mx-auto mb-16">
            <div className="grid md:grid-cols-3 gap-6">
              {t.career.benefitsList.map((benefit, index) => (
                <div key={index} className="card-responsive text-center">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gold/10 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-gold" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Application Form */}
          <section className="max-w-3xl mx-auto">
            <article className="card-responsive">
              <header className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-cinzel font-bold mb-3">
                  {t.career.formTitle}
                </h2>
                <p className="text-muted-foreground">
                  {t.career.formSubtitle}
                </p>
              </header>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" aria-label={t.career.formTitle}>
                {/* Personal Information */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="fullName">{t.career.fullName} *</Label>
                    <Input
                      id="fullName"
                      {...register("fullName")}
                      placeholder="Ion Popescu"
                      className="mt-2"
                    />
                    {errors.fullName && (
                      <p className="text-destructive text-sm mt-1">{errors.fullName.message}</p>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">{t.career.email} *</Label>
                      <Input
                        id="email"
                        type="email"
                        {...register("email")}
                        placeholder="ion.popescu@email.com"
                        className="mt-2"
                      />
                      {errors.email && (
                        <p className="text-destructive text-sm mt-1">{errors.email.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="phone">{t.career.phone} *</Label>
                      <Input
                        id="phone"
                        {...register("phone")}
                        placeholder="0712345678"
                        className="mt-2"
                      />
                      {errors.phone && (
                        <p className="text-destructive text-sm mt-1">{errors.phone.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Position & Experience */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="position">{t.career.position} *</Label>
                    <Select value={position} onValueChange={(value) => setValue("position", value)}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder={t.career.selectPosition} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="agent-imobiliar">{t.career.positions["agent-imobiliar"]}</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.position && (
                      <p className="text-destructive text-sm mt-1">{errors.position.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="experience">{t.career.experience} *</Label>
                    <Select value={experience} onValueChange={(value) => setValue("experience", value)}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder={t.career.selectExperience} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fara-experienta">{t.career.experienceLevels["fara-experienta"]}</SelectItem>
                        <SelectItem value="0-2-ani">{t.career.experienceLevels["0-2-ani"]}</SelectItem>
                        <SelectItem value="2-5-ani">{t.career.experienceLevels["2-5-ani"]}</SelectItem>
                        <SelectItem value="5plus-ani">{t.career.experienceLevels["5plus-ani"]}</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.experience && (
                      <p className="text-destructive text-sm mt-1">{errors.experience.message}</p>
                    )}
                  </div>
                </div>

                {/* CV Upload */}
                <div>
                  <Label htmlFor="cv">{t.career.uploadCv}</Label>
                  <div className="mt-2">
                    <label
                      htmlFor="cv"
                      className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gold/30 rounded-lg cursor-pointer hover:border-gold/50 transition-colors glass"
                    >
                      <div className="text-center">
                        <Upload className="w-8 h-8 text-gold mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">
                          {cvFile ? cvFile.name : t.career.uploadCvText}
                        </p>
                      </div>
                      <input
                        id="cv"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Cover Letter */}
                <div>
                  <Label htmlFor="coverLetter">{t.career.coverLetter} *</Label>
                  <Textarea
                    id="coverLetter"
                    {...register("coverLetter")}
                    placeholder={t.career.coverLetterPlaceholder}
                    rows={6}
                    className="mt-2"
                  />
                  {errors.coverLetter && (
                    <p className="text-destructive text-sm mt-1">{errors.coverLetter.message}</p>
                  )}
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  variant="luxury"
                  size="lg"
                  disabled={isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? (
                    <>{t.career.submitting}</>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      {t.career.submit}
                    </>
                  )}
                </Button>
              </form>
            </article>
          </section>
        </main>

        <Footer />
      </div>
    </>
  )
}

export default Cariera