import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Upload, X, UserPlus, Home } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"

const formSchema = z.object({
  nume: z.string().min(2, "Numele trebuie să aibă cel puțin 2 caractere"),
  prenume: z.string().min(2, "Prenumele trebuie să aibă cel puțin 2 caractere"),  
  email: z.string().email("Email invalid"),
  telefon: z.string().min(10, "Numărul de telefon trebuie să aibă cel puțin 10 cifre"),
  tipProprietate: z.string().min(1, "Selectează tipul proprietății"),
  tipTranzactie: z.string().min(1, "Selectează tipul tranzacției"),
  adresa: z.string().min(5, "Adresa trebuie să aibă cel puțin 5 caractere"),
  pret: z.string().min(1, "Prețul este obligatoriu"),
  suprafata: z.string().min(1, "Suprafața este obligatorie"),
  descriere: z.string().min(10, "Descrierea trebuie să aibă cel puțin 10 caractere"),
})

interface CollaborationFormProps {
  children: React.ReactNode
}

export const CollaborationForm = ({ children }: CollaborationFormProps) => {
  const [open, setOpen] = useState(false)
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nume: "",
      prenume: "",
      email: "",
      telefon: "",
      tipProprietate: "",
      tipTranzactie: "",
      adresa: "",
      pret: "",
      suprafata: "",
      descriere: "",
    },
  })

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/')
      const isUnder10MB = file.size < 10 * 1024 * 1024 // 10MB
      if (!isImage) {
        toast({
          title: "Fișier invalid",
          description: "Te rugăm să încarci doar imagini.",
          variant: "destructive",
        })
        return false
      }
      if (!isUnder10MB) {
        toast({
          title: "Fișier prea mare",
          description: "Imaginile trebuie să fie mai mici de 10MB.",
          variant: "destructive",
        })
        return false
      }
      return true
    })
    
    setSelectedImages(prev => [...prev, ...validFiles].slice(0, 6)) // Max 6 images
  }

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index))
  }

  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true)
    
    try {
      // Convert images to base64
      const imagePromises = selectedImages.map(file => convertImageToBase64(file))
      const base64Images = await Promise.all(imagePromises)
      
      const imageData = selectedImages.map((file, index) => ({
        name: file.name,
        size: file.size,
        type: file.type,
        data: base64Images[index]
      }))

      const { error } = await supabase.functions.invoke('send-collaboration-email', {
        body: {
          ...values,
          images: imageData
        }
      })

      if (error) throw error

      toast({
        title: "Mulțumim pentru colaborare!",
        description: "Propunerea ta a fost trimisă cu succes. Te vom contacta în curând.",
      })
      
      form.reset()
      setSelectedImages([])
      setOpen(false)
    } catch (error) {
      console.error('Error submitting collaboration form:', error)
      toast({
        title: "Eroare",
        description: "A apărut o eroare la trimiterea formularului. Te rugăm să încerci din nou.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Home className="h-5 w-5 text-gold" />
            Colaborează cu noi
          </DialogTitle>
          <DialogDescription>
            Completează formularul pentru a propune o proprietate pentru colaborare.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Contact Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nume"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nume</FormLabel>
                    <FormControl>
                      <Input placeholder="Numele tău" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="prenume"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prenume</FormLabel>
                    <FormControl>
                      <Input placeholder="Prenumele tău" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@exemplu.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="telefon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefon</FormLabel>
                    <FormControl>
                      <Input placeholder="0712345678" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Property Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Detalii proprietate</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="tipProprietate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tip proprietate</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selectează tipul" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="garsoniera">Garsonieră</SelectItem>
                          <SelectItem value="apartament">Apartament</SelectItem>
                          <SelectItem value="casa">Casă</SelectItem>
                          <SelectItem value="vila">Vilă</SelectItem>
                          <SelectItem value="teren">Teren</SelectItem>
                          <SelectItem value="spatiu-comercial">Spațiu comercial</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tipTranzactie"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tip tranzacție</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selectează tipul" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="vanzare">Vânzare</SelectItem>
                          <SelectItem value="inchiriere">Închiriere</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="suprafata"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Suprafața (mp)</FormLabel>
                      <FormControl>
                        <Input placeholder="ex: 65 mp" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="adresa"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adresa</FormLabel>
                    <FormControl>
                      <Input placeholder="Adresa completă a proprietății" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pret"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preț</FormLabel>
                    <FormControl>
                      <Input placeholder="ex: 85.000 EUR" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="descriere"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descriere</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descrie proprietatea în detaliu (locație, caracteristici, facilități, etc.)"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Image Upload */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Imagini proprietate</h3>
              
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                <Input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Alege imagini (max 6, sub 10MB fiecare)
                  </p>
                </label>
              </div>

              {selectedImages.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {selectedImages.map((file, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeImage(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                      <Badge variant="secondary" className="absolute bottom-1 left-1 text-xs">
                        {file.name.slice(0, 8)}...
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting}
              variant="luxury"
            >
              {isSubmitting ? "Se trimite..." : "Trimite propunerea"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}