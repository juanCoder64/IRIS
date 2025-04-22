import os
import pydicom
from pydicom.filereader import dcmread
import matplotlib.pyplot as plt

# puse los dicoms adentro del proyecto
# les recomiendo hacer lo mismo, el git está configurado
# para ignorar la carpeta DICOMS, entonces no se van a subir
path = '../DICOMS/Mastografias/ CAN912724033'

ds= dcmread(path+'/DICOMDIR')

for r in ds.DirectoryRecordSequence: #por cada registro en el dicomdir
    if hasattr(r,'ReferencedFileID'): #si hace referencia a un archivo
        print(r.ReferencedFileID) #imprimir su nombre
        # leer el archivo
        estudio= pydicom.dcmread(os.path.join(path+'/'+r.ReferencedFileID[0]+'/'+r.ReferencedFileID[1]))
        if hasattr(estudio,'pixel_array'):
            # si es imagen la muestra
            plt.axis('off')
            plt.subplots_adjust(0,0,1,1)
            plt.imshow(estudio.pixel_array, cmap='gray')
            #plt.show()
            #save image as jpg with the same name as the dicom
            plt.imsave(os.path.join(estudio.SOPInstanceUID+'.jpg'),estudio.pixel_array, cmap='gray')



        else:
            # si no es imagen imprime la información
            print(estudio)