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

const jobApplicationSchema = z.object({
  fullName: z.string().min(3, "Numele trebuie să conțină minim 3 caractere"),
  email: z.string().email("Email invalid"),
  phone: z.string().min(10, "Număr de telefon invalid"),
  position: z.string().min(1, "Selectează poziția dorită"),
  experience: z.string().min(1, "Selectează experiența"),
  coverLetter: z.string().min(50, "Scrisoarea de intenție trebuie să conțină minim 50 caractere"),
})

type JobApplicationForm = z.infer<typeof jobApplicationSchema>

const Cariera = () => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [cvFile, setCvFile] = useState<File | null>(null)
  const { toast } = useToast()

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
          title: "Fișier prea mare",
          description: "CV-ul nu poate depăși 5MB",
          variant: "destructive",
        })
        return
      }
      if (!file.type.includes("pdf") && !file.type.includes("doc")) {
        toast({
          title: "Format invalid",
          description: "Te rugăm să încarci un fișier PDF sau DOC",
          variant: "destructive",
        })
        return
      }
      setCvFile(file)
    }
  }

  const onSubmit = async (data: JobApplicationForm) => {
    if (!cvFile) {
      toast({
        title: "CV lipsă",
        description: "Te rugăm să încarci CV-ul",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Convert CV to base64
      const reader = new FileReader()
      const cvBase64 = await new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const base64 = reader.result as string
          resolve(base64.split(",")[1])
        }
        reader.readAsDataURL(cvFile)
      })

      const { error } = await supabase.functions.invoke("send-collaboration-email", {
        body: {
          name: data.fullName,
          email: data.email,
          phone: data.phone,
          propertyType: data.position,
          description: data.coverLetter,
          experience: data.experience,
          images: [
            {
              filename: cvFile.name,
              content: cvBase64,
              contentType: cvFile.type,
            },
          ],
        },
      })

      if (error) throw error

      toast({
        title: "Aplicare trimisă cu succes!",
        description: "Vă mulțumim pentru interes. Vă vom contacta în curând.",
      })

      reset()
      setCvFile(null)
    } catch (error) {
      console.error("Error submitting application:", error)
      toast({
        title: "Eroare la trimitere",
        description: "A apărut o eroare. Te rugăm să încerci din nou.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Helmet>
        <title>Carieră - Alătură-te Echipei MVA Imobiliare</title>
        <meta
          name="description"
          content="Caută o carieră în domeniul imobiliar? Descoperă oportunitățile de angajare la MVA Imobiliare și alătură-te echipei noastre de profesioniști."
        />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/10">
        <Header />

        <main className="container mx-auto px-4 pt-32 pb-20">
          {/* Hero Section */}
          <div className="max-w-4xl mx-auto text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-gold/20 mb-6">
              <Briefcase className="w-4 h-4 text-gold" />
              <span className="text-sm text-gold">Alătură-te Echipei</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-cinzel font-bold mb-6 bg-gradient-to-r from-gold via-gold-light to-gold bg-clip-text text-transparent">
              Construiește o Carieră de Succes
            </h1>

            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              La MVA Imobiliare căutăm constant profesioniști pasionați care doresc să facă parte
              dintr-o echipă dinamică și orientată spre excelență în domeniul imobiliar premium.
            </p>
          </div>

          {/* Benefits Section */}
          <div className="max-w-6xl mx-auto mb-16">
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  title: "Creștere Profesională",
                  description: "Programe de training și dezvoltare continuă",
                },
                {
                  title: "Mediu Motivant",
                  description: "Lucru cu proprietăți premium și clienți sofisticați",
                },
                {
                  title: "Recompense Competitive",
                  description: "Salarizare atractivă și sistem de bonusuri",
                },
              ].map((benefit, index) => (
                <div key={index} className="card-responsive text-center">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gold/10 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-gold" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Application Form */}
          <div className="max-w-3xl mx-auto">
            <div className="card-responsive">
              <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-cinzel font-bold mb-3">
                  Formular de Aplicare
                </h2>
                <p className="text-muted-foreground">
                  Completează formularul de mai jos și ne vom întoarce cu un răspuns în maximum 48 de ore
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="fullName">Nume Complet *</Label>
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
                      <Label htmlFor="email">Email *</Label>
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
                      <Label htmlFor="phone">Telefon *</Label>
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
                    <Label htmlFor="position">Poziție Dorită *</Label>
                    <Select value={position} onValueChange={(value) => setValue("position", value)}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Selectează poziția" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="agent-imobiliar">Agent Imobiliar</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.position && (
                      <p className="text-destructive text-sm mt-1">{errors.position.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="experience">Experiență *</Label>
                    <Select value={experience} onValueChange={(value) => setValue("experience", value)}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Selectează experiența" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fara-experienta">Fără Experiență</SelectItem>
                        <SelectItem value="0-2-ani">0-2 ani</SelectItem>
                        <SelectItem value="2-5-ani">2-5 ani</SelectItem>
                        <SelectItem value="5plus-ani">Peste 5 ani</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.experience && (
                      <p className="text-destructive text-sm mt-1">{errors.experience.message}</p>
                    )}
                  </div>
                </div>

                {/* CV Upload */}
                <div>
                  <Label htmlFor="cv">Încarcă CV *</Label>
                  <div className="mt-2">
                    <label
                      htmlFor="cv"
                      className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gold/30 rounded-lg cursor-pointer hover:border-gold/50 transition-colors glass"
                    >
                      <div className="text-center">
                        <Upload className="w-8 h-8 text-gold mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">
                          {cvFile ? cvFile.name : "Click pentru a încărca CV-ul (PDF, DOC - max 5MB)"}
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
                  <Label htmlFor="coverLetter">Scrisoare de Intenție *</Label>
                  <Textarea
                    id="coverLetter"
                    {...register("coverLetter")}
                    placeholder="Scrie câteva rânduri despre motivația ta de a te alătura echipei MVA Imobiliare..."
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
                    <>Trimitem aplicația...</>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Trimite Aplicația
                    </>
                  )}
                </Button>
              </form>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  )
}

export default Cariera
