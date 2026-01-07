package com.example.project_iot_auto_watering.ui.document

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.lifecycle.ViewModelProvider
import androidx.navigation.fragment.findNavController
import com.example.project_iot_auto_watering.MainViewModel
import com.example.project_iot_auto_watering.MainViewModelFactory
import com.example.project_iot_auto_watering.R
import com.example.project_iot_auto_watering.data.model.response.Plant
import com.example.project_iot_auto_watering.data.repository.MainRepository
import com.example.project_iot_auto_watering.data.retrofit.RetrofitInstance
import com.example.project_iot_auto_watering.databinding.FragmentDocumentBinding

class FragmentDocument : Fragment(), View.OnClickListener {
    private var _binding: FragmentDocumentBinding? = null
    private val binding get() = _binding!!

    private lateinit var mainViewModel: MainViewModel

    private lateinit var plant: Plant
    private val mainRepository = MainRepository(RetrofitInstance.api)

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentDocumentBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        initListener()
        initViewModel()
        getData()
    }

    private fun initListener() {
        binding.iconBack.setOnClickListener(this)
    }

    override fun onClick(p0: View?) {
        when (p0?.id) {
            R.id.icon_back -> {
                findNavController().popBackStack()
            }
        }
    }

    private fun initViewModel() {
        mainViewModel = ViewModelProvider(
            requireActivity(),
            MainViewModelFactory(mainRepository)
        )[MainViewModel::class.java]
        plant=mainViewModel.getInfoPlant(mainViewModel.idPlant)
    }
    private fun getData(){
        binding.tvDescription.text=plant.description
        binding.namePlant.text=plant.name
        binding.maxTemperature.text="${getString(R.string.max_Temperature)}${plant.maxTemperature}°C"
        binding.minTemperature.text="${getString(R.string.min_Temperature)}${plant.minTemperature}°C"
        binding.maxAirHumidity.text="${getString(R.string.max_AirHumidity)}${plant.maxAirHumidity}°%"
        binding.minAirHumidity.text="${getString(R.string.min_AirHumidity)}${plant.minAirHumidity}%"
        binding.maxSoilMoisture.text="${getString(R.string.max_SoilMoisture)}${plant.maxSoilMoisture}%"
        binding.minSoilMoisture.text="${getString(R.string.min_SoilMoisture)}${plant.minSoilMoisture}%"
    }

}