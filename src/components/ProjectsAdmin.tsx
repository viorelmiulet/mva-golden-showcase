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
  X
} from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

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
      status: project.status || 'available'
    })
    setIsEditOpen(true)
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
          updated_at: new Date().toISOString()
        })
        .eq('id', editingProject.id)

      if (error) throw error

      toast({
        title: "Succes!",
        description: "Proiectul a fost actualizat cu succes"
      })

      queryClient.invalidateQueries({ queryKey: ['real_estate_projects'] })
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
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-gold" />
            Administrare Complexe Rezidențiale
          </CardTitle>
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
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditModal(project)}
                      className="border-gold/30 hover:bg-gold/10"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Editează
                    </Button>
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
                                        <div key={property.id} className="p-2 bg-background/50 rounded text-xs space-y-1">
                                          <div className="font-medium">{property.title}</div>
                                          <div className="text-muted-foreground">
                                            {property.surface_min}-{property.surface_max} mp | 
                                            {formatPrice(property.price_min)}-{formatPrice(property.price_max)} € |
                                            {property.available_units || 1} disponibile
                                          </div>
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
    </div>
  )
}

export default ProjectsAdmin
