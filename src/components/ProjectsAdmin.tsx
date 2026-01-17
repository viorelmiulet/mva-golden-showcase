import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { 
  Plus, 
  Edit, 
  Save,
  Building2,
  ChevronDown,
  ChevronUp,
  Home,
  Ruler,
  Euro,
  X,
  Upload,
  Image as ImageIcon,
  Trash2,
  Share2,
  Loader2
} from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ExcelApartmentImporter } from "./ExcelApartmentImporter"
import { ApartmentStatusManager } from "./ApartmentStatusManager"
import { triggerProjectSocialAutoPost } from "@/lib/socialAutoPost"

interface PropertyGroup {
  rooms: number
  available_units: number
  surface_min: number
  surface_max: number
  price_min: number
  price_max: number
  properties: any[]
}

const ProjectsAdmin = () => {
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<any>(null)
  const [editForm, setEditForm] = useState<any>({})
  const [isUpdating, setIsUpdating] = useState(false)
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({})
  const [expandedRooms, setExpandedRooms] = useState<Record<string, boolean>>({})
  const [uploadingImage, setUploadingImage] = useState(false)
  const [editingProperty, setEditingProperty] = useState<any>(null)
  const [isEditPropertyOpen, setIsEditPropertyOpen] = useState(false)
  const [propertyForm, setPropertyForm] = useState<any>({})
  const [isUpdatingProperty, setIsUpdatingProperty] = useState(false)
  const [isAddPropertyOpen, setIsAddPropertyOpen] = useState(false)
  const [newPropertyForm, setNewPropertyForm] = useState<any>({})
  const [isCreatingProperty, setIsCreatingProperty] = useState(false)
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false)
  const [newProjectForm, setNewProjectForm] = useState<any>({})
  const [isCreatingProject, setIsCreatingProject] = useState(false)
  const [postingToSocial, setPostingToSocial] = useState<string | null>(null)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch projects
  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['real_estate_projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('real_estate_projects')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data
    }
  })

  // Fetch properties for each project
  const { data: propertiesByProject } = useQuery({
    queryKey: ['catalog_offers_by_project'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('catalog_offers')
        .select('*')
        .order('rooms', { ascending: true })
      
      if (error) throw error
      
      // Group properties by project_id and rooms
      const grouped: Record<string, Record<number, PropertyGroup>> = {}
      
      data?.forEach((property: any) => {
        const projectId = property.project_id || 'unassigned'
        
        if (!grouped[projectId]) {
          grouped[projectId] = {}
        }
        
        if (!grouped[projectId][property.rooms]) {
          grouped[projectId][property.rooms] = {
            rooms: property.rooms,
            available_units: 0,
            surface_min: property.surface_min || 0,
            surface_max: property.surface_max || 0,
            price_min: property.price_min || 0,
            price_max: property.price_max || 0,
            properties: []
          }
        }
        
        const group = grouped[projectId][property.rooms]
        group.available_units += property.available_units || 1
        group.properties.push(property)
        
        // Update min/max values
        if (property.surface_min < group.surface_min || group.surface_min === 0) {
          group.surface_min = property.surface_min
        }
        if (property.surface_max > group.surface_max) {
          group.surface_max = property.surface_max
        }
        if (property.price_min < group.price_min || group.price_min === 0) {
          group.price_min = property.price_min
        }
        if (property.price_max > group.price_max) {
          group.price_max = property.price_max
        }
      })
      
      return grouped
    }
  })

  const openEditModal = (project: any) => {
    setEditingProject(project)
    setEditForm({
      name: project.name || '',
      location: project.location || '',
      developer: project.developer || '',
      price_range: project.price_range || '',
      surface_range: project.surface_range || '',
      rooms_range: project.rooms_range || '',
      description: project.description || '',
      features: Array.isArray(project.features) ? project.features.join(', ') : '',
      amenities: Array.isArray(project.amenities) ? project.amenities.join(', ') : '',
      location_advantages: Array.isArray(project.location_advantages) ? project.location_advantages.join(', ') : '',
      investment_details: project.investment_details || '',
      payment_plans: Array.isArray(project.payment_plans) ? project.payment_plans.join(', ') : '',
      completion_date: project.completion_date || '',
      status: project.status || 'available',
      main_image: project.main_image || ''
    })
    setIsEditOpen(true)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('project-images')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('project-images')
        .getPublicUrl(filePath)

      // Actualizează imediat în baza de date folosind funcția Edge (service role)
      const { data: fnData, error: fnError } = await supabase.functions.invoke('update-project-image', {
        body: { projectId: editingProject.id, main_image: publicUrl }
      })
      if (fnError) throw fnError

      setEditForm({ ...editForm, main_image: publicUrl })
      toast({ title: "Succes!", description: "Imaginea a fost încărcată și salvată" })
      // Reîmprospătăm listele pentru a vedea imediat imaginea
      queryClient.invalidateQueries({ queryKey: ['real_estate_projects'] })
      queryClient.invalidateQueries({ queryKey: ['real_estate_projects_public'] })
    } catch (error: any) {
      toast({
        title: "Eroare",
        description: error.message || "Nu am putut încărca imaginea",
        variant: "destructive"
      })
    } finally {
      setUploadingImage(false)
    }
  }

  const openPropertyEditModal = (property: any) => {
    setEditingProperty(property)
    setPropertyForm({
      title: property.title || '',
      location: property.location || '',
      description: property.description || '',
      price_min: property.price_min || 0,
      price_max: property.price_max || 0,
      surface_min: property.surface_min || 0,
      surface_max: property.surface_max || 0,
      rooms: property.rooms || 1,
      available_units: property.available_units || 1
    })
    setIsEditPropertyOpen(true)
  }

  const closePropertyEditModal = () => {
    setEditingProperty(null)
    setPropertyForm({})
    setIsEditPropertyOpen(false)
  }

  const updateProperty = async () => {
    if (!editingProperty) return
    
    setIsUpdatingProperty(true)
    try {
      const { error } = await supabase
        .from('catalog_offers')
        .update({
          title: propertyForm.title,
          location: propertyForm.location,
          description: propertyForm.description,
          price_min: parseInt(propertyForm.price_min),
          price_max: parseInt(propertyForm.price_max),
          surface_min: parseInt(propertyForm.surface_min),
          surface_max: parseInt(propertyForm.surface_max),
          rooms: parseInt(propertyForm.rooms),
          available_units: parseInt(propertyForm.available_units),
          updated_at: new Date().toISOString()
        })
        .eq('id', editingProperty.id)

      if (error) throw error

      toast({
        title: "Succes!",
        description: "Proprietatea a fost actualizată cu succes"
      })

      queryClient.invalidateQueries({ queryKey: ['catalog_offers_by_project'] })
      closePropertyEditModal()
    } catch (error: any) {
      toast({
        title: "Eroare", 
        description: error.message || "Nu am putut actualiza proprietatea",
        variant: "destructive"
      })
    } finally {
      setIsUpdatingProperty(false)
    }
  }

  const openAddPropertyModal = () => {
    setNewPropertyForm({
      title: '',
      location: editingProject?.location || '',
      description: '',
      price_min: 0,
      price_max: 0,
      surface_min: 0,
      surface_max: 0,
      rooms: 1,
      available_units: 1,
      project_id: editingProject?.id
    })
    setIsAddPropertyOpen(true)
  }

  const closeAddPropertyModal = () => {
    setNewPropertyForm({})
    setIsAddPropertyOpen(false)
  }

  const createProperty = async () => {
    if (!editingProject) return
    
    setIsCreatingProperty(true)
    try {
      const { error } = await supabase
        .from('catalog_offers')
        .insert({
          title: newPropertyForm.title,
          location: newPropertyForm.location,
          description: newPropertyForm.description,
          price_min: parseInt(newPropertyForm.price_min),
          price_max: parseInt(newPropertyForm.price_max),
          surface_min: parseInt(newPropertyForm.surface_min),
          surface_max: parseInt(newPropertyForm.surface_max),
          rooms: parseInt(newPropertyForm.rooms),
          available_units: parseInt(newPropertyForm.available_units),
          project_id: editingProject.id,
          project_name: editingProject.name,
          source: 'manual',
          images: []
        })

      if (error) throw error

      toast({
        title: "Succes!",
        description: "Tipul de proprietate a fost adăugat"
      })

      queryClient.invalidateQueries({ queryKey: ['catalog_offers_by_project'] })
      closeAddPropertyModal()
    } catch (error: any) {
      toast({
        title: "Eroare",
        description: error.message || "Nu am putut adăuga proprietatea",
        variant: "destructive"
      })
    } finally {
      setIsCreatingProperty(false)
    }
  }

  const deleteProperty = async (propertyId: string) => {
    if (!confirm('Sigur doriți să ștergeți acest tip de proprietate?')) return
    
    try {
      const { error } = await supabase
        .from('catalog_offers')
        .delete()
        .eq('id', propertyId)

      if (error) throw error

      toast({
        title: "Succes!",
        description: "Tipul de proprietate a fost șters"
      })

      queryClient.invalidateQueries({ queryKey: ['catalog_offers_by_project'] })
    } catch (error: any) {
      toast({
        title: "Eroare",
        description: error.message || "Nu am putut șterge proprietatea",
        variant: "destructive"
      })
    }
  }

  const openAddProjectModal = () => {
    setNewProjectForm({
      name: '',
      location: '',
      developer: '',
      price_range: '',
      surface_range: '',
      rooms_range: '',
      description: '',
      features: '',
      amenities: '',
      location_advantages: '',
      investment_details: '',
      payment_plans: '',
      completion_date: '',
      status: 'available',
      main_image: ''
    })
    setIsAddProjectOpen(true)
  }

  const closeAddProjectModal = () => {
    setNewProjectForm({})
    setIsAddProjectOpen(false)
  }

  const createProject = async () => {
    setIsCreatingProject(true)
    try {
      const { error } = await supabase
        .from('real_estate_projects')
        .insert({
          name: newProjectForm.name,
          location: newProjectForm.location,
          developer: newProjectForm.developer,
          price_range: newProjectForm.price_range,
          surface_range: newProjectForm.surface_range,
          rooms_range: newProjectForm.rooms_range,
          description: newProjectForm.description,
          features: newProjectForm.features ? newProjectForm.features.split(',').map((f: string) => f.trim()).filter(Boolean) : [],
          amenities: newProjectForm.amenities ? newProjectForm.amenities.split(',').map((a: string) => a.trim()).filter(Boolean) : [],
          location_advantages: newProjectForm.location_advantages ? newProjectForm.location_advantages.split(',').map((l: string) => l.trim()).filter(Boolean) : [],
          investment_details: newProjectForm.investment_details,
          payment_plans: newProjectForm.payment_plans ? newProjectForm.payment_plans.split(',').map((p: string) => p.trim()).filter(Boolean) : [],
          completion_date: newProjectForm.completion_date,
          status: newProjectForm.status,
          main_image: newProjectForm.main_image
        })

      if (error) throw error

      toast({
        title: "Succes!",
        description: "Ansamblul rezidențial a fost creat"
      })

      queryClient.invalidateQueries({ queryKey: ['real_estate_projects'] })
      closeAddProjectModal()
    } catch (error: any) {
      toast({
        title: "Eroare",
        description: error.message || "Nu am putut crea ansamblul",
        variant: "destructive"
      })
    } finally {
      setIsCreatingProject(false)
    }
  }

  const deleteProject = async (projectId: string) => {
    if (!confirm('Sigur doriți să ștergeți acest ansamblu rezidențial? Toate proprietățile asociate vor fi de asemenea șterse.')) return
    
    try {
      // First delete all properties associated with this project
      const { error: propertiesError } = await supabase
        .from('catalog_offers')
        .delete()
        .eq('project_id', projectId)

      if (propertiesError) throw propertiesError

      // Then delete the project
      const { error } = await supabase
        .from('real_estate_projects')
        .delete()
        .eq('id', projectId)

      if (error) throw error

      toast({
        title: "Succes!",
        description: "Ansamblul rezidențial a fost șters"
      })

      queryClient.invalidateQueries({ queryKey: ['real_estate_projects'] })
      queryClient.invalidateQueries({ queryKey: ['catalog_offers_by_project'] })
    } catch (error: any) {
      toast({
        title: "Eroare",
        description: error.message || "Nu am putut șterge ansamblul",
        variant: "destructive"
      })
    }
  }

  const handleShareToSocial = async (projectId: string, projectName: string) => {
    setPostingToSocial(projectId)
    try {
      const success = await triggerProjectSocialAutoPost(projectId, 'all')
      
      if (success) {
        toast({
          title: "Succes!",
          description: `"${projectName}" a fost trimis către Zapier`
        })
      } else {
        toast({
          title: "Atenție",
          description: "Nu s-a putut trimite către Zapier. Verificați configurarea webhook-urilor.",
          variant: "destructive"
        })
      }
    } catch (error: any) {
      toast({
        title: "Eroare",
        description: error.message || "Nu am putut trimite către social media",
        variant: "destructive"
      })
    } finally {
      setPostingToSocial(null)
    }
  }

  const handlePropertyImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, propertyId: string) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploadingImage(true)
    try {
      const uploadedUrls: string[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
        const filePath = `${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('project-images')
          .upload(filePath, file)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('project-images')
          .getPublicUrl(filePath)

        uploadedUrls.push(publicUrl)
      }

      // Get current property images
      const { data: currentProperty } = await supabase
        .from('catalog_offers')
        .select('images')
        .eq('id', propertyId)
        .single()

      const currentImages = Array.isArray(currentProperty?.images) 
        ? currentProperty.images as string[]
        : []
      const updatedImages = [...currentImages, ...uploadedUrls]

      // Update property with new images
      const { error: updateError } = await supabase
        .from('catalog_offers')
        .update({ images: updatedImages })
        .eq('id', propertyId)

      if (updateError) throw updateError

      toast({ title: "Succes!", description: "Imaginile au fost adăugate" })
      queryClient.invalidateQueries({ queryKey: ['catalog_offers_by_project'] })
    } catch (error: any) {
      toast({
        title: "Eroare",
        description: error.message || "Nu am putut încărca imaginile",
        variant: "destructive"
      })
    } finally {
      setUploadingImage(false)
    }
  }

  const deletePropertyImage = async (propertyId: string, imageUrl: string) => {
    try {
      const { data: currentProperty } = await supabase
        .from('catalog_offers')
        .select('images')
        .eq('id', propertyId)
        .single()

      const currentImages = Array.isArray(currentProperty?.images)
        ? currentProperty.images as string[]
        : []
      const updatedImages = currentImages.filter((img: string) => img !== imageUrl)

      const { error: updateError } = await supabase
        .from('catalog_offers')
        .update({ images: updatedImages })
        .eq('id', propertyId)

      if (updateError) throw updateError

      toast({ title: "Succes!", description: "Imaginea a fost ștearsă" })
      queryClient.invalidateQueries({ queryKey: ['catalog_offers_by_project'] })
    } catch (error: any) {
      toast({
        title: "Eroare",
        description: error.message || "Nu am putut șterge imaginea",
        variant: "destructive"
      })
    }
  }

  const closeEditModal = () => {
    setIsEditOpen(false)
    setEditingProject(null)
    setEditForm({})
  }

  const updateProject = async () => {
    if (!editingProject) return
    
    setIsUpdating(true)
    try {
      const { error } = await supabase
        .from('real_estate_projects')
        .update({
          name: editForm.name,
          location: editForm.location,
          developer: editForm.developer,
          price_range: editForm.price_range,
          surface_range: editForm.surface_range,
          rooms_range: editForm.rooms_range,
          description: editForm.description,
          features: editForm.features ? editForm.features.split(',').map((f: string) => f.trim()).filter(Boolean) : [],
          amenities: editForm.amenities ? editForm.amenities.split(',').map((a: string) => a.trim()).filter(Boolean) : [],
          location_advantages: editForm.location_advantages ? editForm.location_advantages.split(',').map((l: string) => l.trim()).filter(Boolean) : [],
          investment_details: editForm.investment_details,
          payment_plans: editForm.payment_plans ? editForm.payment_plans.split(',').map((p: string) => p.trim()).filter(Boolean) : [],
          completion_date: editForm.completion_date,
          status: editForm.status,
          main_image: editForm.main_image,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingProject.id)

      if (error) throw error

      toast({
        title: "Succes!",
        description: "Proiectul a fost actualizat cu succes"
      })

      // Invalidate both queries to refresh the data
      await queryClient.invalidateQueries({ queryKey: ['real_estate_projects'] })
      await queryClient.invalidateQueries({ queryKey: ['real_estate_projects_public'] })
      
      closeEditModal()
    } catch (error: any) {
      toast({
        title: "Eroare", 
        description: error.message || "Nu am putut actualiza proiectul",
        variant: "destructive"
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const toggleProjectExpansion = (projectId: string) => {
    setExpandedProjects(prev => ({
      ...prev,
      [projectId]: !prev[projectId]
    }))
  }

  const toggleRoomExpansion = (key: string) => {
    setExpandedRooms(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ro-RO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 3
    }).format(price)
  }

  if (projectsLoading) {
    return (
      <Card className="glass">
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Se încarcă proiectele...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="glass border-gold/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-gold" />
              Administrare Complexe Rezidențiale
            </CardTitle>
            <Button
              onClick={openAddProjectModal}
              className="bg-gold hover:bg-gold/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adaugă Ansamblu
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {projects?.map((project) => {
            const projectProperties = propertiesByProject?.[project.id]
            const isExpanded = expandedProjects[project.id]

            return (
              <Card key={project.id} className="border-gold/10">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-foreground mb-1">{project.name}</h3>
                      <p className="text-sm text-muted-foreground">{project.location}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="secondary" className="bg-gold/10 text-gold border-gold/20">
                          {project.price_range}
                        </Badge>
                        <Badge variant="secondary">
                          {project.surface_range}
                        </Badge>
                        <Badge variant="secondary">
                          {project.rooms_range}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleShareToSocial(project.id, project.name)}
                        disabled={postingToSocial === project.id}
                        className="border-blue-500/30 hover:bg-blue-500/10 text-blue-500"
                      >
                        {postingToSocial === project.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Share2 className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditModal(project)}
                        className="border-gold/30 hover:bg-gold/10"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Editează
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteProject(project.id)}
                        className="border-destructive/30 hover:bg-destructive/10 text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {projectProperties && Object.keys(projectProperties).length > 0 && (
                    <div className="space-y-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleProjectExpansion(project.id)}
                        className="w-full justify-between"
                      >
                        <span className="text-sm font-medium">
                          Proprietăți ({Object.keys(projectProperties).length} tipuri)
                        </span>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>

                      {isExpanded && (
                        <div className="space-y-2 mt-2">
                          {Object.values(projectProperties).map((group: PropertyGroup, idx) => {
                            const roomKey = `${project.id}-${group.rooms}`
                            const isRoomExpanded = expandedRooms[roomKey]

                            return (
                              <Card key={idx} className="bg-secondary/20">
                                <CardContent className="p-3">
                                  <Collapsible open={isRoomExpanded} onOpenChange={() => toggleRoomExpansion(roomKey)}>
                                    <CollapsibleTrigger asChild>
                                      <div className="flex items-center justify-between cursor-pointer hover:bg-secondary/30 rounded-lg p-2 transition-colors">
                                        <div className="flex items-center gap-4 flex-1">
                                          <div className="flex items-center gap-2">
                                            <Home className="w-4 h-4 text-gold" />
                                            <span className="font-semibold">{group.rooms} {group.rooms === 1 ? 'cameră' : 'camere'}</span>
                                            <span className="text-xs text-muted-foreground">
                                              ({group.available_units} {group.available_units === 1 ? 'disponibilă' : 'disponibile'})
                                            </span>
                                          </div>
                                          
                                          <div className="flex items-center gap-2 text-sm">
                                            <Ruler className="w-3 h-3 text-muted-foreground" />
                                            <span className="text-muted-foreground">
                                              {group.surface_min} mp - {group.surface_max} mp
                                            </span>
                                          </div>
                                          
                                          <div className="flex items-center gap-2 text-sm">
                                            <Euro className="w-3 h-3 text-gold" />
                                            <span className="font-medium text-gold">
                                              {formatPrice(group.price_min)} € - {formatPrice(group.price_max)} €
                                            </span>
                                          </div>
                                        </div>
                                        
                                        {isRoomExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                      </div>
                                    </CollapsibleTrigger>
                                    
                                     <CollapsibleContent className="mt-2 space-y-1">
                                       {group.properties.map((property: any) => (
                                         <div key={property.id} className="p-2 bg-background/50 rounded text-xs space-y-2">
                                       <div className="flex items-start justify-between">
                                              <div className="flex-1">
                                                <div className="font-medium">{property.title}</div>
                                                <div className="text-muted-foreground">
                                                  {property.surface_min}-{property.surface_max} mp | 
                                                  {formatPrice(property.price_min)}-{formatPrice(property.price_max)} € |
                                                  {property.available_units || 1} disponibile
                                                </div>
                                              </div>
                                              <div className="flex gap-1">
                                                <Button
                                                  size="sm"
                                                  variant="ghost"
                                                  onClick={() => openPropertyEditModal(property)}
                                                >
                                                  <Edit className="w-3 h-3" />
                                                </Button>
                                                <Button
                                                  size="sm"
                                                  variant="ghost"
                                                  onClick={() => deleteProperty(property.id)}
                                                  className="text-destructive hover:text-destructive"
                                                >
                                                  <Trash2 className="w-3 h-3" />
                                                </Button>
                                              </div>
                                            </div>
                                           {Array.isArray(property.images) && property.images.length > 0 && (
                                             <div className="flex gap-1 flex-wrap">
                                               {property.images.slice(0, 3).map((img: string, idx: number) => (
                                                 <img
                                                   key={idx}
                                                   src={img}
                                                   alt={`Property ${idx + 1}`}
                                                   className="w-12 h-12 object-cover rounded"
                                                 />
                                               ))}
                                               {property.images.length > 3 && (
                                                 <div className="w-12 h-12 bg-secondary rounded flex items-center justify-center text-xs">
                                                   +{property.images.length - 3}
                                                 </div>
                                               )}
                                             </div>
                                           )}
                                         </div>
                                       ))}
                                     </CollapsibleContent>
                                  </Collapsible>
                                </CardContent>
                              </Card>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </CardContent>
      </Card>

      {/* Edit Project Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editează Proiect</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nume Proiect</Label>
                <Input
                  id="name"
                  value={editForm.name || ''}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="location">Locație</Label>
                <Input
                  id="location"
                  value={editForm.location || ''}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="developer">Developer</Label>
              <Input
                id="developer"
                value={editForm.developer || ''}
                onChange={(e) => setEditForm({ ...editForm, developer: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="price_range">Interval Prețuri</Label>
                <Input
                  id="price_range"
                  value={editForm.price_range || ''}
                  onChange={(e) => setEditForm({ ...editForm, price_range: e.target.value })}
                  placeholder="€40,000 - €90,000"
                />
              </div>
              
              <div>
                <Label htmlFor="surface_range">Interval Suprafețe</Label>
                <Input
                  id="surface_range"
                  value={editForm.surface_range || ''}
                  onChange={(e) => setEditForm({ ...editForm, surface_range: e.target.value })}
                  placeholder="30 - 75 mp"
                />
              </div>
              
              <div>
                <Label htmlFor="rooms_range">Camere</Label>
                <Input
                  id="rooms_range"
                  value={editForm.rooms_range || ''}
                  onChange={(e) => setEditForm({ ...editForm, rooms_range: e.target.value })}
                  placeholder="1-3 camere"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Descriere</Label>
              <Textarea
                id="description"
                value={editForm.description || ''}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={3}
              />
            </div>

            {/* Image Upload Section */}
            <div className="space-y-2">
              <Label>Imagine Principală</Label>
              {editForm.main_image && (
                <div className="relative w-full h-48 rounded-lg overflow-hidden border">
                  <img
                    src={editForm.main_image}
                    alt="Main project"
                    className="w-full h-full object-cover"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => setEditForm({ ...editForm, main_image: '' })}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  className="flex-1"
                />
                {uploadingImage && (
                  <span className="text-sm text-muted-foreground">Se încarcă...</span>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="features">Caracteristici (separate prin virgulă)</Label>
              <Textarea
                id="features"
                value={editForm.features || ''}
                onChange={(e) => setEditForm({ ...editForm, features: e.target.value })}
                placeholder="Finisaje Premium, Spații Verzi, Design Modern"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="amenities">Facilități (separate prin virgulă)</Label>
              <Textarea
                id="amenities"
                value={editForm.amenities || ''}
                onChange={(e) => setEditForm({ ...editForm, amenities: e.target.value })}
                placeholder="Parcare, Lift, Sistem Securitate"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="location_advantages">Avantaje Locație (separate prin virgulă)</Label>
              <Textarea
                id="location_advantages"
                value={editForm.location_advantages || ''}
                onChange={(e) => setEditForm({ ...editForm, location_advantages: e.target.value })}
                placeholder="Acces rapid la metrou, Zone comerciale"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="investment_details">Detalii Investiție</Label>
              <Textarea
                id="investment_details"
                value={editForm.investment_details || ''}
                onChange={(e) => setEditForm({ ...editForm, investment_details: e.target.value })}
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="payment_plans">Planuri de Plată (separate prin virgulă)</Label>
              <Textarea
                id="payment_plans"
                value={editForm.payment_plans || ''}
                onChange={(e) => setEditForm({ ...editForm, payment_plans: e.target.value })}
                placeholder="Plata în rate, Avans 15%"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="completion_date">Data Finalizare</Label>
                <Input
                  id="completion_date"
                  value={editForm.completion_date || ''}
                  onChange={(e) => setEditForm({ ...editForm, completion_date: e.target.value })}
                  placeholder="Q4 2025"
                />
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Input
                  id="status"
                  value={editForm.status || ''}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  placeholder="available"
                />
              </div>
            </div>

            {/* Property Types Management */}
            <div className="space-y-2 border-t pt-4">
              <div className="flex items-center justify-between">
                <Label>Tipuri de Proprietăți</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openAddPropertyModal}
                  className="border-gold/30 hover:bg-gold/10"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adaugă Tip
                </Button>
              </div>
              
              {editingProject && propertiesByProject?.[editingProject.id] && (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {Object.values(propertiesByProject[editingProject.id]).map((group: PropertyGroup, idx) => (
                    <Card key={idx} className="bg-secondary/20">
                      <CardContent className="p-3">
                        <div className="text-sm font-medium mb-2">
                          {group.rooms} {group.rooms === 1 ? 'cameră' : 'camere'} - {group.available_units} unități
                        </div>
                        <div className="space-y-1">
                          {group.properties.map((property: any) => (
                            <div key={property.id} className="flex items-center justify-between text-xs bg-background/50 p-2 rounded">
                              <span className="flex-1">{property.title}</span>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => openPropertyEditModal(property)}
                                  className="h-6 w-6 p-0"
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => deleteProperty(property.id)}
                                  className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Excel Import & Status Management */}
            {editingProject && (
              <div className="space-y-4 border-t pt-4">
                <Label className="text-base font-semibold">Import & Management Apartamente</Label>
                
                <ExcelApartmentImporter 
                  projectId={editingProject.id} 
                  onImportComplete={() => {
                    queryClient.invalidateQueries({ queryKey: ['catalog_offers_by_project'] });
                    queryClient.invalidateQueries({ queryKey: ['project-apartments', editingProject.id] });
                  }}
                />
                
                <ApartmentStatusManager projectId={editingProject.id} />
              </div>
            )}

            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={closeEditModal}>
                <X className="w-4 h-4 mr-2" />
                Anulează
              </Button>
              <Button onClick={updateProject} disabled={isUpdating}>
                <Save className="w-4 h-4 mr-2" />
                {isUpdating ? 'Se salvează...' : 'Salvează'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Project Dialog */}
      <Dialog open={isAddProjectOpen} onOpenChange={setIsAddProjectOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adaugă Ansamblu Rezidențial</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="new_project_name">Nume Proiect</Label>
                <Input
                  id="new_project_name"
                  value={newProjectForm.name || ''}
                  onChange={(e) => setNewProjectForm({ ...newProjectForm, name: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="new_project_location">Locație</Label>
                <Input
                  id="new_project_location"
                  value={newProjectForm.location || ''}
                  onChange={(e) => setNewProjectForm({ ...newProjectForm, location: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="new_project_developer">Developer</Label>
              <Input
                id="new_project_developer"
                value={newProjectForm.developer || ''}
                onChange={(e) => setNewProjectForm({ ...newProjectForm, developer: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="new_project_price_range">Interval Prețuri</Label>
                <Input
                  id="new_project_price_range"
                  value={newProjectForm.price_range || ''}
                  onChange={(e) => setNewProjectForm({ ...newProjectForm, price_range: e.target.value })}
                  placeholder="€40,000 - €90,000"
                />
              </div>
              
              <div>
                <Label htmlFor="new_project_surface_range">Interval Suprafețe</Label>
                <Input
                  id="new_project_surface_range"
                  value={newProjectForm.surface_range || ''}
                  onChange={(e) => setNewProjectForm({ ...newProjectForm, surface_range: e.target.value })}
                  placeholder="30 - 75 mp"
                />
              </div>
              
              <div>
                <Label htmlFor="new_project_rooms_range">Camere</Label>
                <Input
                  id="new_project_rooms_range"
                  value={newProjectForm.rooms_range || ''}
                  onChange={(e) => setNewProjectForm({ ...newProjectForm, rooms_range: e.target.value })}
                  placeholder="1-3 camere"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="new_project_description">Descriere</Label>
              <Textarea
                id="new_project_description"
                value={newProjectForm.description || ''}
                onChange={(e) => setNewProjectForm({ ...newProjectForm, description: e.target.value })}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="new_project_features">Caracteristici (separate prin virgulă)</Label>
              <Textarea
                id="new_project_features"
                value={newProjectForm.features || ''}
                onChange={(e) => setNewProjectForm({ ...newProjectForm, features: e.target.value })}
                placeholder="Finisaje Premium, Spații Verzi, Design Modern"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="new_project_amenities">Facilități (separate prin virgulă)</Label>
              <Textarea
                id="new_project_amenities"
                value={newProjectForm.amenities || ''}
                onChange={(e) => setNewProjectForm({ ...newProjectForm, amenities: e.target.value })}
                placeholder="Parcare, Lift, Sistem Securitate"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="new_project_location_advantages">Avantaje Locație (separate prin virgulă)</Label>
              <Textarea
                id="new_project_location_advantages"
                value={newProjectForm.location_advantages || ''}
                onChange={(e) => setNewProjectForm({ ...newProjectForm, location_advantages: e.target.value })}
                placeholder="Acces rapid la metrou, Zone comerciale"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="new_project_completion_date">Data Finalizare</Label>
                <Input
                  id="new_project_completion_date"
                  value={newProjectForm.completion_date || ''}
                  onChange={(e) => setNewProjectForm({ ...newProjectForm, completion_date: e.target.value })}
                  placeholder="Q4 2025"
                />
              </div>

              <div>
                <Label htmlFor="new_project_status">Status</Label>
                <Input
                  id="new_project_status"
                  value={newProjectForm.status || 'available'}
                  onChange={(e) => setNewProjectForm({ ...newProjectForm, status: e.target.value })}
                  placeholder="available"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={closeAddProjectModal}>
                <X className="w-4 h-4 mr-2" />
                Anulează
              </Button>
              <Button onClick={createProject} disabled={isCreatingProject}>
                <Plus className="w-4 h-4 mr-2" />
                {isCreatingProject ? 'Se creează...' : 'Creează'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Property Dialog */}
      <Dialog open={isAddPropertyOpen} onOpenChange={setIsAddPropertyOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Adaugă Tip de Proprietate</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="new_title">Titlu</Label>
                <Input
                  id="new_title"
                  value={newPropertyForm.title || ''}
                  onChange={(e) => setNewPropertyForm({ ...newPropertyForm, title: e.target.value })}
                  placeholder="ex: Apartament 2 Camere Tip A"
                />
              </div>
              <div>
                <Label htmlFor="new_location">Locație</Label>
                <Input
                  id="new_location"
                  value={newPropertyForm.location || ''}
                  onChange={(e) => setNewPropertyForm({ ...newPropertyForm, location: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="new_price_min">Preț Min (€)</Label>
                <Input
                  id="new_price_min"
                  type="number"
                  value={newPropertyForm.price_min || 0}
                  onChange={(e) => setNewPropertyForm({ ...newPropertyForm, price_min: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="new_price_max">Preț Max (€)</Label>
                <Input
                  id="new_price_max"
                  type="number"
                  value={newPropertyForm.price_max || 0}
                  onChange={(e) => setNewPropertyForm({ ...newPropertyForm, price_max: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="new_surface_min">Suprafață Min (mp)</Label>
                <Input
                  id="new_surface_min"
                  type="number"
                  value={newPropertyForm.surface_min || 0}
                  onChange={(e) => setNewPropertyForm({ ...newPropertyForm, surface_min: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="new_surface_max">Suprafață Max (mp)</Label>
                <Input
                  id="new_surface_max"
                  type="number"
                  value={newPropertyForm.surface_max || 0}
                  onChange={(e) => setNewPropertyForm({ ...newPropertyForm, surface_max: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="new_rooms">Camere</Label>
                <Input
                  id="new_rooms"
                  type="number"
                  value={newPropertyForm.rooms || 1}
                  onChange={(e) => setNewPropertyForm({ ...newPropertyForm, rooms: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="new_available_units">Unități Disponibile</Label>
                <Input
                  id="new_available_units"
                  type="number"
                  value={newPropertyForm.available_units || 1}
                  onChange={(e) => setNewPropertyForm({ ...newPropertyForm, available_units: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="new_description">Descriere</Label>
              <Textarea
                id="new_description"
                value={newPropertyForm.description || ''}
                onChange={(e) => setNewPropertyForm({ ...newPropertyForm, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={closeAddPropertyModal}>
                <X className="w-4 h-4 mr-2" />
                Anulează
              </Button>
              <Button onClick={createProperty} disabled={isCreatingProperty}>
                <Plus className="w-4 h-4 mr-2" />
                {isCreatingProperty ? 'Se adaugă...' : 'Adaugă'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Property Dialog */}
      <Dialog open={isEditPropertyOpen} onOpenChange={setIsEditPropertyOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editează Proprietate</DialogTitle>
          </DialogHeader>
          
          {editingProperty && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="property_title">Titlu</Label>
                  <Input
                    id="property_title"
                    value={propertyForm.title || ''}
                    onChange={(e) => setPropertyForm({ ...propertyForm, title: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="property_location">Locație</Label>
                  <Input
                    id="property_location"
                    value={propertyForm.location || ''}
                    onChange={(e) => setPropertyForm({ ...propertyForm, location: e.target.value })}
                  />
                </div>
              </div>

              {/* Property Images */}
              <div className="space-y-2">
                <Label>Imagini Proprietate</Label>
                {Array.isArray(editingProperty.images) && editingProperty.images.length > 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {editingProperty.images.map((img: string, idx: number) => (
                      <div key={idx} className="relative group">
                        <img
                          src={img}
                          alt={`Property ${idx + 1}`}
                          className="w-full h-24 object-cover rounded"
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => deletePropertyImage(editingProperty.id, img)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handlePropertyImageUpload(e, editingProperty.id)}
                    disabled={uploadingImage}
                    className="flex-1"
                  />
                  {uploadingImage && (
                    <span className="text-sm text-muted-foreground">Se încarcă...</span>
                  )}
                </div>
              </div>

              {/* Property Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price_min">Preț Min (€)</Label>
                  <Input
                    id="price_min"
                    type="number"
                    value={propertyForm.price_min || 0}
                    onChange={(e) => setPropertyForm({ ...propertyForm, price_min: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="price_max">Preț Max (€)</Label>
                  <Input
                    id="price_max"
                    type="number"
                    value={propertyForm.price_max || 0}
                    onChange={(e) => setPropertyForm({ ...propertyForm, price_max: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="surface_min">Suprafață Min (mp)</Label>
                  <Input
                    id="surface_min"
                    type="number"
                    value={propertyForm.surface_min || 0}
                    onChange={(e) => setPropertyForm({ ...propertyForm, surface_min: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="surface_max">Suprafață Max (mp)</Label>
                  <Input
                    id="surface_max"
                    type="number"
                    value={propertyForm.surface_max || 0}
                    onChange={(e) => setPropertyForm({ ...propertyForm, surface_max: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="rooms">Camere</Label>
                  <Input
                    id="rooms"
                    type="number"
                    value={propertyForm.rooms || 1}
                    onChange={(e) => setPropertyForm({ ...propertyForm, rooms: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="available_units">Unități disponibile</Label>
                  <Input
                    id="available_units"
                    type="number"
                    value={propertyForm.available_units || 1}
                    onChange={(e) => setPropertyForm({ ...propertyForm, available_units: e.target.value })}
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="property_description">Descriere</Label>
                <Textarea
                  id="property_description"
                  value={propertyForm.description || ''}
                  onChange={(e) => setPropertyForm({ ...propertyForm, description: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button variant="outline" onClick={closePropertyEditModal}>
                  <X className="w-4 h-4 mr-2" />
                  Anulează
                </Button>
                <Button onClick={updateProperty} disabled={isUpdatingProperty}>
                  <Save className="w-4 h-4 mr-2" />
                  {isUpdatingProperty ? 'Se salvează...' : 'Salvează'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ProjectsAdmin
